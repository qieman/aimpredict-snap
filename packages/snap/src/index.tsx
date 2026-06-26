import type { OnCronjobHandler, OnRpcRequestHandler } from '@metamask/snaps-sdk';

import { configureSnap, pollMessages } from './poll-messages';

export const onCronjob: OnCronjobHandler = async ({ request }) => {
  switch (request.method) {
    case 'pollMessages':
      await pollMessages();
      return null;

    default:
      throw new Error('Method not found.');
  }
};

export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  switch (request.method) {
    case 'configure': {
      const params = request.params as { apiBaseUrl?: string } | undefined;
      return configureSnap(params?.apiBaseUrl);
    }

    case 'pollMessages':
      await pollMessages();
      return { success: true };

    default:
      throw new Error('Method not found.');
  }
};
