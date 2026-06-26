import { describe, expect, it } from '@jest/globals';

import {
  buildNotificationContent,
  buildNotificationDetailUrl,
  buildNotificationNotifyParams,
  buildShortNotificationMessage,
} from './notify-message';

describe('buildShortNotificationMessage', () => {
  it('prefers the title for the short preview', () => {
    expect(
      buildShortNotificationMessage({
        id: 1,
        type: 'event_price_alert',
        title: 'Price movement in a followed market',
        body: 'Long body',
        createdAt: 1,
        refEventId: 2,
        refEventName: null,
        refMarketId: null,
        refMarketName: null,
      }),
    ).toBe('Price movement in a followed market');
  });

  it('truncates long preview text to 80 characters', () => {
    const longTitle = 'a'.repeat(90);
    expect(
      buildShortNotificationMessage({
        id: 1,
        type: 'event_price_alert',
        title: longTitle,
        body: '',
        createdAt: 1,
        refEventId: null,
        refEventName: null,
        refMarketId: null,
        refMarketName: null,
      }),
    ).toHaveLength(80);
  });
});

describe('buildNotificationNotifyParams', () => {
  it('omits footerLink for http localhost URLs', () => {
    const params = buildNotificationNotifyParams(
      {
        id: 1,
        type: 'event_price_alert',
        title: 'Alert',
        body: 'Body',
        createdAt: 1,
        refEventId: 42,
        refEventName: null,
        refMarketId: null,
        refMarketName: null,
      },
      'http://localhost:3000',
    );

    expect(params.footerLink).toBeUndefined();
    expect(params.title).toBe('Alert');
  });

  it('includes footerLink for https URLs', () => {
    const params = buildNotificationNotifyParams(
      {
        id: 1,
        type: 'event_price_alert',
        title: 'Alert',
        body: 'Body',
        createdAt: 1,
        refEventId: 42,
        refEventName: null,
        refMarketId: null,
        refMarketName: null,
      },
      'https://aimpredict.com',
    );

    expect(params.footerLink).toEqual({
      text: 'View on AimPredict',
      href: 'https://aimpredict.com/en-us?event=42',
    });
  });
});

describe('buildNotificationContent', () => {
  it('wraps event and market names in square brackets', () => {
    const content = buildNotificationContent({
      id: 1,
      type: 'event_price_alert',
      title: 'Alert',
      body: ['Rippling', '', 'Rippling YES price rose from 40% to 60%.'].join(
        '\n',
      ),
      createdAt: 1,
      refEventId: 42,
      refEventName: 'Will Deel or Rippling IPO first?',
      refMarketId: 9,
      refMarketName: 'Rippling',
    });

    const serialized = JSON.stringify(content);
    expect(serialized).toContain('[Will Deel or Rippling IPO first?]');
    expect(serialized).toContain('[Rippling]');
    expect(serialized).toContain('Rippling YES price rose from 40% to 60%.');
  });

  it('hides duplicate market name when it matches the event name', () => {
    const content = buildNotificationContent({
      id: 1,
      type: 'event_price_alert',
      title: 'Alert',
      body: 'YES price rose from 40% to 60%.',
      createdAt: 1,
      refEventId: 42,
      refEventName: 'Will Deel or Rippling IPO first?',
      refMarketId: 9,
      refMarketName: 'Will Deel or Rippling IPO first?',
    });

    const serialized = JSON.stringify(content);
    expect(serialized).toContain('[Will Deel or Rippling IPO first?]');
    expect(serialized.match(/\[Will Deel or Rippling IPO first\?\]/g)).toHaveLength(
      1,
    );
  });
});

describe('buildNotificationDetailUrl', () => {
  it('links to the event detail page when refEventId exists', () => {
    expect(
      buildNotificationDetailUrl('http://localhost:3000', {
        id: 1,
        type: 'event_price_alert',
        title: 'Alert',
        body: 'Body',
        createdAt: 1,
        refEventId: 42,
        refEventName: null,
        refMarketId: null,
        refMarketName: null,
      }),
    ).toBe('http://localhost:3000/en-us?event=42');
  });
});
