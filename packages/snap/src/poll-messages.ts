import type { SnapMessagesResponse, SnapPollState } from './types';
import {
  applyBaselineState,
  applyPollResultState,
  groupMessagesByCategory,
  hasNewBoundAddresses,
  resolveApiBaseUrl,
  SNAP_MESSAGE_CATEGORY_ORDER,
} from './types';
import { getPollState, setPollState } from './state';
import { buildGroupedNotificationNotifyParams } from './notify-message';

async function getEthereumAccounts(): Promise<string[]> {
  const accounts = (await ethereum.request({
    method: 'eth_accounts',
  })) as string[];

  if (!Array.isArray(accounts)) {
    return [];
  }

  return accounts.filter((account): account is string => typeof account === 'string');
}

async function requestEthereumAccounts(): Promise<string[]> {
  try {
    const accounts = (await ethereum.request({
      method: 'eth_requestAccounts',
    })) as string[];

    if (!Array.isArray(accounts)) {
      return [];
    }

    return accounts.filter((account): account is string => typeof account === 'string');
  } catch {
    return getEthereumAccounts();
  }
}

async function isWalletUnlocked(): Promise<boolean> {
  const status = (await snap.request({
    method: 'snap_getClientStatus',
  })) as { locked?: boolean };

  return status?.locked !== true;
}

async function fetchSnapMessages(
  apiBaseUrl: string,
  addresses: string[],
  sinceId: number,
): Promise<SnapMessagesResponse> {
  const response = await fetch(`${apiBaseUrl}/api/snap/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      addresses,
      sinceId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Snap messages request failed with status ${response.status}`);
  }

  return (await response.json()) as SnapMessagesResponse;
}

async function notifyMessages(
  messages: SnapMessagesResponse['messages'],
  apiBaseUrl: string,
): Promise<void> {
  if (messages.length === 0) {
    return;
  }

  const grouped = groupMessagesByCategory(messages);

  for (const category of SNAP_MESSAGE_CATEGORY_ORDER) {
    const categoryMessages = grouped.get(category);
    if (!categoryMessages || categoryMessages.length === 0) {
      continue;
    }

    await snap.request({
      method: 'snap_notify',
      params: buildGroupedNotificationNotifyParams(
        category,
        categoryMessages,
        apiBaseUrl,
      ),
    });
  }
}

export async function pollMessages(): Promise<void> {
  if (!(await isWalletUnlocked())) {
    return;
  }

  const accounts = await getEthereumAccounts();
  if (accounts.length === 0) {
    return;
  }

  let state = await getPollState();
  const apiBaseUrl = resolveApiBaseUrl(state);
  const response = await fetchSnapMessages(
    apiBaseUrl,
    accounts,
    state.lastSeenId,
  );

  if (hasNewBoundAddresses(response.boundAddresses, state.knownAddresses)) {
    state = {
      ...state,
      initialized: false,
    };
  }

  if (!state.initialized) {
    await setPollState(
      applyBaselineState(state, response.latestId, response.boundAddresses),
    );
    return;
  }

  if (response.messages.length > 0) {
    await notifyMessages(response.messages, apiBaseUrl);
  }

  await setPollState(
    applyPollResultState(
      state,
      response.messages.length > 0
        ? Math.max(...response.messages.map((message) => message.id))
        : response.latestId,
      response.boundAddresses,
    ),
  );
}

export async function configureSnap(apiBaseUrl?: string): Promise<{ success: true; accounts: string[] }> {
  const accounts = await requestEthereumAccounts();
  const state = await getPollState();
  const nextState: SnapPollState = {
    ...state,
    apiBaseUrl:
      typeof apiBaseUrl === 'string' && apiBaseUrl.trim().length > 0
        ? apiBaseUrl.trim()
        : state.apiBaseUrl,
  };

  await setPollState(nextState);
  return { success: true, accounts };
}
