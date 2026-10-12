/**
 * VaultMarketsFollowsResource hits its literal v1 paths, handles encoded,
 * feed kinds as one comma list, and has no verb that could place an order.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsFollowsResource } from '../resources/vault-markets-follows.js';
import type { HttpClient } from '../client.js';

describe('VaultMarketsFollowsResource', () => {
  it('maps every verb to its route', async () => {
    const calls: Array<{ method: string; path: string; body?: unknown; query?: Record<string, unknown> }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    const r = new VaultMarketsFollowsResource(http);
    await r.sharing();
    await r.updateSharing({ orders: true });
    await r.following();
    await r.feed({ kinds: ['buy', 'sale'], limit: 10 });
    await r.activity('@ann x');
    await r.leaderboard({ period: '30d', category: 'pokemon' });
    await r.copyWatches();
    await r.startCopyWatch('ann');
    await r.stopCopyWatch('a/b');
    await r.copyWatchAlerts({ limit: 5 });
    await r.markCopyWatchAlertsRead();
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault-markets/follows/sharing',
      'PUT /v1/vault-markets/follows/sharing',
      'GET /v1/vault-markets/follows/following',
      'GET /v1/vault-markets/follows/feed',
      'GET /v1/vault-markets/follows/profiles/%40ann%20x/activity',
      'GET /v1/vault-markets/follows/leaderboards',
      'GET /v1/vault-markets/follows/copy-watch',
      'PUT /v1/vault-markets/follows/copy-watch/ann',
      'DELETE /v1/vault-markets/follows/copy-watch/a%2Fb',
      'GET /v1/vault-markets/follows/copy-watch/alerts',
      'POST /v1/vault-markets/follows/copy-watch/alerts/read',
    ]);
    expect(calls[1]!.body).toEqual({ orders: true });
    expect(calls[3]!.query).toEqual({ before: undefined, limit: 10, kinds: 'buy,sale' });
    expect(calls[5]!.query).toEqual({ period: '30d', category: 'pokemon' });
  });

  it('has no verb that trades', () => {
    const verbs = Object.getOwnPropertyNames(VaultMarketsFollowsResource.prototype);
    expect(verbs.filter((v) => /order|copyTrade|mirror|place/i.test(v))).toEqual([]);
  });
});
