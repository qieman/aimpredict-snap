# AimPredict Snap

MetaMask Snap for [AimPredict](https://www.aimpredict.com/) wallet push notifications.

When wallet push is enabled in AimPredict and your MetaMask address is linked, this Snap polls for unread alerts every minute and shows in-app notifications for followed prediction markets (price moves, volume spikes, market closing, and more).

## Snap ID

```
npm:@aim-predict/snap
```

## Install

The recommended way to install is from the AimPredict user center:

1. Sign in at [aimpredict.com](https://www.aimpredict.com/)
2. Open **User Center** → enable **Wallet push**
3. Click **Install AimPredict Snap** (or **Reconnect Snap** if already installed)
4. Approve the Snap in MetaMask

You can also install programmatically from a dapp:

```ts
await ethereum.request({
  method: 'wallet_requestSnaps',
  params: {
    'npm:@aim-predict/snap': { version: '0.1.1' },
  },
});

await ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:@aim-predict/snap',
    request: {
      method: 'configure',
      params: { apiBaseUrl: 'https://www.aimpredict.com' },
    },
  },
});
```

## Permissions


| Permission                    | Purpose                                           |
| ----------------------------- | ------------------------------------------------- |
| `endowment:cronjob`           | Poll AimPredict every minute for new alerts       |
| `endowment:network-access`    | Call `POST /api/snap/messages`                    |
| `endowment:ethereum-provider` | Read linked wallet addresses                      |
| `snap_manageState`            | Store poll cursor and API base URL                |
| `snap_notify`                 | Show in-app notifications with expandable details |
| `endowment:rpc`               | Expose `configure` and `pollMessages` to dapps    |


## RPC methods

### `configure`

Sets the AimPredict API base URL and requests wallet account access.

```ts
{ method: 'configure', params: { apiBaseUrl: 'https://www.aimpredict.com' } }
```

### `pollMessages`

Manually triggers a poll (also invoked by the cron job).

## Links

- Website: [https://www.aimpredict.com/](https://www.aimpredict.com/)

## License

MIT-0 OR Apache-2.0