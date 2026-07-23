import { describe, expect, it } from '@jest/globals';

import {
  buildGroupedNotificationContent,
  buildGroupedNotificationNotifyParams,
} from './notify-message';
import type { SnapMessage } from './types';

const sampleFollowedMarketMessage: SnapMessage = {
  id: 1,
  type: 'event_price_alert',
  title: 'Price movement in a followed market',
  body: 'Rippling YES price rose from 40% to 60%.',
  createdAt: 1,
  refEventId: 42,
  refEventName: 'Will Deel or Rippling IPO first?',
  refMarketId: 9,
  refMarketName: 'Rippling',
  refPlatformName: null,
};

describe('buildGroupedNotificationNotifyParams', () => {
  it('uses the category title and api base URL for the footer link', () => {
    const params = buildGroupedNotificationNotifyParams(
      'followed_market',
      [sampleFollowedMarketMessage],
      'https://aimpredict.com',
    );

    expect(params.title).toBe('New updates in your followed markets');
    expect(params.message).toBe('New updates in your followed markets');
    expect(params.footerLink).toEqual({
      text: 'Open AimPredict',
      href: 'https://aimpredict.com',
    });
  });

  it('upgrades http api base URLs to https for the footer link', () => {
    const params = buildGroupedNotificationNotifyParams(
      'followed_market',
      [sampleFollowedMarketMessage],
      'http://localhost:3000',
    );

    expect(params.footerLink).toEqual({
      text: 'Open AimPredict',
      href: 'https://localhost:3000',
    });
  });

  it('uses platform and reminder titles for their categories', () => {
    expect(
      buildGroupedNotificationNotifyParams(
        'platform',
        [
          {
            ...sampleFollowedMarketMessage,
            id: 2,
            type: 'platform_new_hot_market',
          },
        ],
        'https://aimpredict.com',
      ).title,
    ).toBe('New updates from platforms you follow');

    expect(
      buildGroupedNotificationNotifyParams(
        'reminders',
        [
          {
            ...sampleFollowedMarketMessage,
            id: 3,
            type: 'category_hot_alert',
          },
        ],
        'https://aimpredict.com',
      ).title,
    ).toBe('New updates in categories you follow');
  });
});

describe('buildGroupedNotificationContent', () => {
  it('renders each message as a bullet list item', () => {
    const content = buildGroupedNotificationContent([
      sampleFollowedMarketMessage,
      {
        ...sampleFollowedMarketMessage,
        id: 2,
        refEventName: 'US Presidential Election 2028',
        refMarketName: 'Democrat',
        body: 'Democrat YES price rose from 45% to 55%.',
      },
    ]);

    const serialized = JSON.stringify(content);
    expect(serialized).toContain('• [Will Deel or Rippling IPO first?] [Rippling]');
    expect(serialized).toContain('• [US Presidential Election 2028] [Democrat]');
  });

  it('renders platform updates with platform, event, market, and body', () => {
    const content = buildGroupedNotificationContent([
      {
        id: 3,
        type: 'platform_new_hot_market',
        title: 'Polymarket New Hot Market',
        body: '"Highest temperature in Seoul on April 3? - 17°C" has entered the new hot market list.',
        createdAt: 1,
        refEventId: 55,
        refEventName: 'Highest temperature in Seoul on April 3?',
        refMarketId: 341,
        refMarketName: '17°C',
        refPlatformName: 'Polymarket',
      },
    ]);

    const serialized = JSON.stringify(content);
    expect(serialized).toContain(
      '• [Polymarket][Highest temperature in Seoul on April 3?] [17°C]',
    );
    expect(serialized).toContain('has entered the new hot market list.');
  });
});
