/**
 * VaultMarketsPaperResource hits its literal v1 paths, ids encoded.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsPaperResource } from '../resources/vault-markets-paper.js';
import type { HttpClient } from '../client.js';

describe('VaultMarketsPaperResource', () => {
  it('maps every verb to its route', async () => {
    const calls: Array<{ method: string; path: string; body?: unknown; query?: unknown }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    const r = new VaultMarketsPaperResource(http);
    await r.account();
    await r.orders({ status: 'working' });
    await r.fills({ limit: 10 });
    await r.quote({ bookKey: 'k', side: 'buy', quantity: 2 });
    await r.placeOrder({ bookKey: 'k', side: 'buy', type: 'limit', quantity: 1, limitCents: 1_000 });
    await r.cancelOrder('o/1');
    await r.reset();
    await r.leaderboard('2026-10-05');
    await r.setLeaderboard({ optIn: true, displayName: 'Slab Hunter' });
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault-markets/paper',
      'GET /v1/vault-markets/paper/orders',
      'GET /v1/vault-markets/paper/fills',
      'GET /v1/vault-markets/paper/quote',
      'POST /v1/vault-markets/paper/orders',
      'POST /v1/vault-markets/paper/orders/o%2F1/cancel',
      'POST /v1/vault-markets/paper/reset',
      'GET /v1/vault-markets/paper/leaderboard',
      'PUT /v1/vault-markets/paper/leaderboard',
    ]);
    expect(calls[3]!.query).toEqual({ bookKey: 'k', side: 'buy', quantity: 2 });
    expect(calls[7]!.query).toEqual({ week: '2026-10-05' });
    expect(calls[8]!.body).toEqual({ optIn: true, displayName: 'Slab Hunter' });
  });
});
