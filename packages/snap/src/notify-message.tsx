import { Box, Text } from '@metamask/snaps-sdk/jsx';

import type { SnapMessage } from './types';

const SNAP_NOTIFY_ALLOWED_LINK_PROTOCOLS = new Set([
  'https:',
  'mailto:',
  'metamask:',
]);

function isSnapNotifyFooterLinkAllowed(href: string): boolean {
  try {
    return SNAP_NOTIFY_ALLOWED_LINK_PROTOCOLS.has(new URL(href).protocol);
  } catch {
    return false;
  }
}

function optionalFooterLink(text: string, href: string) {
  if (!isSnapNotifyFooterLinkAllowed(href)) {
    return {};
  }

  return { footerLink: { text, href } };
}

const SHORT_MESSAGE_MAX_LENGTH = 80;

function truncateText(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 3)}...`;
}

export function buildShortNotificationMessage(message: SnapMessage): string {
  const title = message.title.trim();
  if (title.length > 0) {
    return truncateText(title, SHORT_MESSAGE_MAX_LENGTH);
  }

  return truncateText(message.body, SHORT_MESSAGE_MAX_LENGTH);
}

export function buildNotificationDetailUrl(
  apiBaseUrl: string,
  message: SnapMessage,
): string {
  const origin = apiBaseUrl.replace(/\/$/, '');
  if (message.refEventId) {
    return `${origin}/en-us?event=${message.refEventId}`;
  }

  return `${origin}/en-us`;
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

export function buildNotificationContent(message: SnapMessage) {
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

  return (
    <Box>
      {eventName ? <Text>{formatBracketedName(eventName)}</Text> : null}
      {displayMarketName ? (
        <Text>{formatBracketedName(displayMarketName)}</Text>
      ) : null}
      {body.length > 0 ? <Text>{body}</Text> : null}
    </Box>
  );
}

export function buildOverflowNotificationNotifyParams(
  overflow: number,
  apiBaseUrl: string,
) {
  const href = `${apiBaseUrl.replace(/\/$/, '')}/en-us`;

  return {
    type: 'inApp' as const,
    message: `You have ${overflow} more alerts`,
    title: 'AimPredict Alerts',
    content: (
      <Box>
        <Text>Open AimPredict to view the remaining notifications.</Text>
      </Box>
    ),
    ...optionalFooterLink('Open AimPredict', href),
  };
}

export function buildNotificationNotifyParams(
  message: SnapMessage,
  apiBaseUrl: string,
) {
  return {
    type: 'inApp' as const,
    message: buildShortNotificationMessage(message),
    title: truncateText(message.title.trim() || 'AimPredict Alert', 120),
    content: buildNotificationContent(message),
    ...optionalFooterLink(
      'View on AimPredict',
      buildNotificationDetailUrl(apiBaseUrl, message),
    ),
  };
}
