import { Box, Text } from '@metamask/snaps-sdk/jsx';

import type { SnapMessage, SnapMessageCategory } from './types';
import { SNAP_MESSAGE_CATEGORY_TITLES } from './types';

function normalizeFooterLinkHref(apiBaseUrl: string): string {
  try {
    const url = new URL(apiBaseUrl.trim());
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
    }
    return url.origin;
  } catch {
    return apiBaseUrl.trim().replace(/^http:\/\//i, 'https://').replace(/\/$/, '');
  }
}

function footerLink(text: string, href: string) {
  return { footerLink: { text, href: normalizeFooterLinkHref(href) } };
}

const SHORT_MESSAGE_MAX_LENGTH = 80;

function truncateText(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 3)}...`;
}

function formatBracketedName(name: string): string {
  return `[${name.trim()}]`;
}

function stripRedundantLeadingBodyLine(
  body: string,
  eventName: string | null,
  marketName: string | null,
): string {
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    return '';
  }

  const lines = trimmedBody.split('\n');
  const firstLineIndex = lines.findIndex((line) => line.trim().length > 0);
  if (firstLineIndex === -1) {
    return '';
  }

  const firstLine = lines[firstLineIndex]?.trim() ?? '';
  if (!firstLine) {
    return trimmedBody;
  }
  const candidates = new Set<string>();
  if (eventName) {
    candidates.add(eventName.trim());
  }
  if (marketName) {
    candidates.add(marketName.trim());
  }
  if (eventName && marketName) {
    candidates.add(`${eventName.trim()} - ${marketName.trim()}`);
    candidates.add(`${eventName.trim()}-${marketName.trim()}`);
  }

  if (!candidates.has(firstLine)) {
    return trimmedBody;
  }

  const rest = lines.slice(firstLineIndex + 1);
  while (rest.length > 0 && (rest[0]?.trim() ?? '') === '') {
    rest.shift();
  }

  return rest.join('\n').trim();
}

function shouldShowMarketName(
  eventName: string | null,
  marketName: string | null,
): boolean {
  if (!marketName) {
    return false;
  }
  if (!eventName) {
    return true;
  }

  return eventName.trim().toLowerCase() !== marketName.trim().toLowerCase();
}

function resolvePlatformName(message: SnapMessage): string | null {
  const fromPayload = message.refPlatformName?.trim();
  if (fromPayload) {
    return fromPayload;
  }

  const title = message.title.trim();
  const suffix = ' New Hot Market';
  if (title.endsWith(suffix)) {
    const platformName = title.slice(0, -suffix.length).trim();
    return platformName.length > 0 ? platformName : null;
  }

  return null;
}

function buildPlatformNotificationListItem(message: SnapMessage) {
  const platformName = resolvePlatformName(message);
  const eventName = message.refEventName?.trim() || null;
  const marketName = message.refMarketName?.trim() || null;
  const body = message.body.trim();

  let prefix = '';
  if (platformName) {
    prefix += formatBracketedName(platformName);
  }
  if (eventName) {
    prefix += formatBracketedName(eventName);
  }
  if (marketName) {
    if (prefix.length > 0) {
      prefix += ' ';
    }
    prefix += formatBracketedName(marketName);
  }

  const summaryParts = [prefix || null, body.length > 0 ? body : null].filter(
    (part): part is string => Boolean(part),
  );

  if (summaryParts.length === 0) {
    const fallback = message.title.trim() || message.body.trim();
    return fallback.length > 0 ? (
      <Text>{`• ${fallback}`}</Text>
    ) : null;
  }

  return <Text>{`• ${summaryParts.join(' ')}`}</Text>;
}

function buildNotificationListItem(message: SnapMessage) {
  if (message.type === 'platform_new_hot_market') {
    return buildPlatformNotificationListItem(message);
  }

  const eventName = message.refEventName?.trim() || null;
  const marketName = message.refMarketName?.trim() || null;
  const displayMarketName = shouldShowMarketName(eventName, marketName)
    ? marketName
    : null;
  const body = stripRedundantLeadingBodyLine(
    message.body,
    eventName,
    displayMarketName,
  );
  const summaryParts = [
    eventName ? formatBracketedName(eventName) : null,
    displayMarketName ? formatBracketedName(displayMarketName) : null,
    body.length > 0 ? body : null,
  ].filter((part): part is string => Boolean(part));

  if (summaryParts.length === 0) {
    const fallback = message.title.trim() || message.body.trim();
    return fallback.length > 0 ? (
      <Text>{`• ${fallback}`}</Text>
    ) : null;
  }

  return <Text>{`• ${summaryParts.join(' ')}`}</Text>;
}

export function buildGroupedNotificationContent(messages: SnapMessage[]) {
  return (
    <Box>
      {messages.map((message) => buildNotificationListItem(message))}
    </Box>
  );
}

export function buildGroupedNotificationNotifyParams(
  category: SnapMessageCategory,
  messages: SnapMessage[],
  apiBaseUrl: string,
) {
  const title = SNAP_MESSAGE_CATEGORY_TITLES[category];

  return {
    type: 'inApp' as const,
    message: truncateText(title, SHORT_MESSAGE_MAX_LENGTH),
    title: truncateText(title, 120),
    content: buildGroupedNotificationContent(messages),
    ...footerLink('Open AimPredict', apiBaseUrl),
  };
}
