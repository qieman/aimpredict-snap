import { expect } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';

describe('onRpcRequest', () => {
  it('configures the snap api base url', async () => {
    const { request } = await installSnap();

    const response = await request({
      method: 'configure',
      params: {
        apiBaseUrl: 'https://aimpredict.com',
      },
    });

    expect(response).toRespondWith({
      success: true,
      accounts: ['0xc6d5a3c98ec9073b54fa0969957bd582e8d874bf'],
    });
  });

  it('throws an error if the requested method does not exist', async () => {
    const { request } = await installSnap();

    const response = await request({
      method: 'foo',
    });

    expect(response).toRespondWithError({
      code: -32603,
      message: 'Method not found.',
      stack: expect.any(String),
    });
  });
});
