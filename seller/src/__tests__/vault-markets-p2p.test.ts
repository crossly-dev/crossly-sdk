/**
 * VaultMarketsP2pResource hits its literal v1 paths, ids encoded.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsP2pResource } from '../resources/vault-markets-p2p.js';
import type { HttpClient } from '../client.js';

describe('VaultMarketsP2pResource', () => {
  it('maps every verb to its route', async () => {
    const calls: Array<{ method: string; path: string; body?: unknown }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    const r = new VaultMarketsP2pResource(http);
    await r.dashboard();
    await r.offers({ bookKey: 'k' });
    await r.myOffers();
    await r.createOffer({ bookKey: 'k', principalCents: 10_000, aprBps: 1_000 });
    await r.cancelOffer('o/1');
    await r.take('o1', { vaultItemId: 'u1' });
    await r.units();
    await r.loans({ role: 'lender' });
    await r.loan('l1');
    await r.repay('l1');
    await r.call('l1');
    await r.auctions();
    await r.refinance('l1', { maxPayoffCents: 100 });
    await r.cancelCall('l1');
    await r.openRefiAuction('l1', { startAprBps: 500, hours: 12 });
    await r.cancelRefiAuction('l/1');
    await r.repay('l1', { amountCents: 2_500 });
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault-markets/p2p/dashboard',
      'GET /v1/vault-markets/p2p/offers',
      'GET /v1/vault-markets/p2p/offers/mine',
      'POST /v1/vault-markets/p2p/offers',
      'POST /v1/vault-markets/p2p/offers/o%2F1/cancel',
      'POST /v1/vault-markets/p2p/offers/o1/take',
      'GET /v1/vault-markets/p2p/units',
      'GET /v1/vault-markets/p2p/loans',
      'GET /v1/vault-markets/p2p/loans/l1',
      'POST /v1/vault-markets/p2p/loans/l1/repay',
      'POST /v1/vault-markets/p2p/loans/l1/call',
      'GET /v1/vault-markets/p2p/auctions',
      'POST /v1/vault-markets/p2p/loans/l1/refinance',
      'POST /v1/vault-markets/p2p/loans/l1/cancel-call',
      'POST /v1/vault-markets/p2p/loans/l1/refi-auction',
      'POST /v1/vault-markets/p2p/loans/l%2F1/refi-auction/cancel',
      'POST /v1/vault-markets/p2p/loans/l1/repay',
    ]);
    expect(calls[14]!.body).toEqual({ startAprBps: 500, hours: 12 });
    expect(calls[16]!.body).toEqual({ amountCents: 2_500 });
  });
});
