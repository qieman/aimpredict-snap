export const DEFAULT_API_BASE_URL =
  typeof process !== 'undefined' && process.env.SNAP_API_BASE_URL
    ? process.env.SNAP_API_BASE_URL
    : 'http://localhost:8000';

export const MAX_IN_APP_NOTIFICATIONS_PER_CRON = 5;

export type SnapMessage = {
  id: number;
  type: string;
  title: string;
  body: string;
  createdAt: number;
  refEventId: number | null;
  refEventName: string | null;
  refMarketId: number | null;
  refMarketName: string | null;
};

export type SnapMessagesResponse = {
  messages: SnapMessage[];
  latestId: number;
  boundAddresses: string[];
};

export type SnapPollState = {
  lastSeenId: number;
  initialized: boolean;
  knownAddresses: string[];
  apiBaseUrl?: string;
};

export const DEFAULT_POLL_STATE: SnapPollState = {
  lastSeenId: 0,
  initialized: false,
  knownAddresses: [],
};

export function normalizeAddressList(addresses: string[]): string[] {
  return [...new Set(addresses.map((address) => address.toLowerCase()))].sort();
}

export function hasNewBoundAddresses(
  boundAddresses: string[],
  knownAddresses: string[],
): boolean {
  const known = new Set(normalizeAddressList(knownAddresses));
  return normalizeAddressList(boundAddresses).some(
    (address) => !known.has(address),
  );
}

export function resolveApiBaseUrl(state: SnapPollState): string {
  const candidate = state.apiBaseUrl?.trim();
  if (!candidate) {
    return DEFAULT_API_BASE_URL;
  }

  try {
    const url = new URL(candidate);
    return url.origin;
  } catch {
    return DEFAULT_API_BASE_URL;
  }
}

export function applyBaselineState(
  state: SnapPollState,
  latestId: number,
  boundAddresses: string[],
): SnapPollState {
  return {
    ...state,
    lastSeenId: Number.isFinite(latestId) && latestId > 0 ? latestId : 0,
    initialized: true,
    knownAddresses: normalizeAddressList(boundAddresses),
  };
}

export function applyPollResultState(
  state: SnapPollState,
  latestId: number,
  boundAddresses: string[],
): SnapPollState {
  return {
    ...state,
    lastSeenId: Number.isFinite(latestId) && latestId >= 0 ? latestId : state.lastSeenId,
    knownAddresses: normalizeAddressList(boundAddresses),
  };
}
