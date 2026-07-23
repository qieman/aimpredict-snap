export const DEFAULT_API_BASE_URL =
  typeof process !== 'undefined' && process.env.SNAP_API_BASE_URL
    ? process.env.SNAP_API_BASE_URL
    : 'http://localhost:8000';

export const MAX_IN_APP_NOTIFICATIONS_PER_CRON = 5;

export const FOLLOWED_MARKET_TYPES = [
  'event_price_alert',
  'event_volume_alert',
  'market_closing_soon',
  'market_closed',
  'market_price_breakthrough',
] as const;

export const PLATFORM_TYPES = ['platform_new_hot_market'] as const;

export const REMINDER_TYPES = ['category_hot_alert'] as const;

export type SnapMessageCategory = 'followed_market' | 'platform' | 'reminders';

export const SNAP_MESSAGE_CATEGORY_ORDER: SnapMessageCategory[] = [
  'followed_market',
  'platform',
  'reminders',
];

export const SNAP_MESSAGE_CATEGORY_TITLES: Record<SnapMessageCategory, string> =
  {
    followed_market: 'New updates in your followed markets',
    platform: 'New updates from platforms you follow',
    reminders: 'New updates in categories you follow',
  };

const CATEGORY_TYPE_MAP: Record<SnapMessageCategory, readonly string[]> = {
  followed_market: FOLLOWED_MARKET_TYPES,
  platform: PLATFORM_TYPES,
  reminders: REMINDER_TYPES,
};

export function resolveSnapMessageCategory(
  type: string,
): SnapMessageCategory | null {
  for (const category of SNAP_MESSAGE_CATEGORY_ORDER) {
    if (CATEGORY_TYPE_MAP[category].includes(type)) {
      return category;
    }
  }

  return null;
}

export function groupMessagesByCategory(
  messages: SnapMessage[],
): Map<SnapMessageCategory, SnapMessage[]> {
  const grouped = new Map<SnapMessageCategory, SnapMessage[]>();

  for (const message of messages) {
    const category = resolveSnapMessageCategory(message.type);
    if (!category) {
      continue;
    }

    const bucket = grouped.get(category);
    if (bucket) {
      bucket.push(message);
    } else {
      grouped.set(category, [message]);
    }
  }

  return grouped;
}

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
  refPlatformName: string | null;
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
