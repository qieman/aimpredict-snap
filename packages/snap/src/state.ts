import { DEFAULT_POLL_STATE, type SnapPollState } from './types';

function isSnapPollState(value: unknown): value is SnapPollState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const state = value as Partial<SnapPollState>;
  return (
    typeof state.lastSeenId === 'number' &&
    Number.isFinite(state.lastSeenId) &&
    state.lastSeenId >= 0 &&
    typeof state.initialized === 'boolean' &&
    Array.isArray(state.knownAddresses) &&
    state.knownAddresses.every((address) => typeof address === 'string') &&
    (state.apiBaseUrl === undefined || typeof state.apiBaseUrl === 'string')
  );
}

export async function getPollState(): Promise<SnapPollState> {
  const persisted = await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'get',
      encrypted: false,
    },
  });

  if (!persisted || typeof persisted !== 'object') {
    return { ...DEFAULT_POLL_STATE };
  }

  const candidate = (persisted as { snapPoll?: unknown }).snapPoll;
  if (!isSnapPollState(candidate)) {
    return { ...DEFAULT_POLL_STATE };
  }

  return {
    ...DEFAULT_POLL_STATE,
    ...candidate,
    knownAddresses: [...candidate.knownAddresses],
  };
}

export async function setPollState(state: SnapPollState): Promise<void> {
  const persisted = await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'get',
      encrypted: false,
    },
  });

  const existingState =
    persisted && typeof persisted === 'object'
      ? (persisted as Record<string, unknown>)
      : {};

  await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      encrypted: false,
      newState: {
        ...existingState,
        snapPoll: state,
      },
    },
  });
}

export async function updatePollState(
  updater: (current: SnapPollState) => SnapPollState,
): Promise<SnapPollState> {
  const current = await getPollState();
  const next = updater(current);
  await setPollState(next);
  return next;
}
