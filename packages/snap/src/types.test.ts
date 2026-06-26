import { describe, expect, it } from '@jest/globals';

import {
  applyBaselineState,
  applyPollResultState,
  hasNewBoundAddresses,
  normalizeAddressList,
  resolveApiBaseUrl,
} from './types';

describe('normalizeAddressList', () => {
  it('deduplicates and lowercases addresses', () => {
    expect(
      normalizeAddressList([
        '0xAb5801a7D398351b0bE50C7E829c529E3D1e5688',
        '0xab5801a7d398351b0be50c7e829c529e3d1e5688',
      ]),
    ).toEqual(['0xab5801a7d398351b0be50c7e829c529e3d1e5688']);
  });
});

describe('hasNewBoundAddresses', () => {
  it('detects newly bound addresses', () => {
    expect(
      hasNewBoundAddresses(
        ['0xab5801a7d398351b0be50c7e829c529e3d1e5688'],
        [],
      ),
    ).toBe(true);
  });

  it('returns false when the bound set is unchanged', () => {
    expect(
      hasNewBoundAddresses(
        ['0xAb5801a7D398351b0bE50C7E829c529E3D1e5688'],
        ['0xab5801a7d398351b0be50c7e829c529e3d1e5688'],
      ),
    ).toBe(false);
  });
});

describe('resolveApiBaseUrl', () => {
  it('falls back to the default when apiBaseUrl is invalid', () => {
    expect(resolveApiBaseUrl({ lastSeenId: 0, initialized: false, knownAddresses: [], apiBaseUrl: 'not-a-url' })).toBe(
      'http://localhost:8000',
    );
  });

  it('uses the configured origin', () => {
    expect(
      resolveApiBaseUrl({
        lastSeenId: 0,
        initialized: false,
        knownAddresses: [],
        apiBaseUrl: 'https://aimpredict.com/snap',
      }),
    ).toBe('https://aimpredict.com');
  });
});

describe('applyBaselineState', () => {
  it('marks the poll state as initialized', () => {
    expect(
      applyBaselineState(
        { lastSeenId: 0, initialized: false, knownAddresses: [] },
        42,
        ['0xab5801a7d398351b0be50c7e829c529e3d1e5688'],
      ),
    ).toEqual({
      lastSeenId: 42,
      initialized: true,
      knownAddresses: ['0xab5801a7d398351b0be50c7e829c529e3d1e5688'],
    });
  });
});

describe('applyPollResultState', () => {
  it('updates the cursor and bound address snapshot', () => {
    expect(
      applyPollResultState(
        { lastSeenId: 10, initialized: true, knownAddresses: [] },
        15,
        ['0xab5801a7d398351b0be50c7e829c529e3d1e5688'],
      ),
    ).toEqual({
      lastSeenId: 15,
      initialized: true,
      knownAddresses: ['0xab5801a7d398351b0be50c7e829c529e3d1e5688'],
    });
  });
});
