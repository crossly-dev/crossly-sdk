/**
 * The buyer after-purchase / lists / browse resources call the documented
 * /v1 path with the documented verb, and are reachable from `buyer.*`.
 */
import { describe, expect, it, vi } from 'vitest';
import { BuyerResource, browseQuery } from '../resources/buyer.js';
import type { HttpClient } from '../client.js';

function makeSpy() {
  const calls: Array<{ method: string; path: string; body?: unknown; query?: unknown; idempotencyKey?: string }> = [];
  const request = vi.fn(async (opts) => {
    calls.push(opts);
    return {} as unknown;
  });
  const http = { request } as unknown as HttpClient;
  return { buyer: new BuyerResource(http), calls };
}

describe('buyer.offers', () => {
  it('list filters to counters waiting on you', async () => {
    const { buyer, calls } = makeSpy();
    await buyer.offers.list({ awaitingBuyer: true });
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/buyer/offers', query: { awaitingBuyer: 'true' } });
  });

  it('respond posts the action with an idempotency key', async () => {
    const { buyer, calls } = makeSpy();
    await buyer.offers.respond('o 1', { action: 'counter', counterCents: 4500 }, { idempotencyKey: 'k' });
    expect(calls[0]).toMatchObject({
      method: 'POST',
      path: '/v1/buyer/offers/o%201/respond',
      body: { action: 'counter', counterCents: 4500 },
      idempotencyKey: 'k',
    });
  });

  it('withdraw is a DELETE', async () => {
    const { buyer, calls } = makeSpy();
    await buyer.offers.withdraw('o1');
    expect(calls[0]).toMatchObject({ method: 'DELETE', path: '/v1/buyer/offers/o1' });
  });
});

describe('buyer.auctions', () => {
  it('maps every verb', async () => {
    const { buyer, calls } = makeSpy();
    await buyer.auctions.list({ tab: 'won' });
    await buyer.auctions.bids('lot-1');
    await buyer.auctions.me('lot-1');
    await buyer.auctions.bid('lot-1', { amountCents: 1500, maxBidCents: 4000 }, { idempotencyKey: 'bid-1' });
    await buyer.auctions.retract('lot-1', 'typo');
    await buyer.auctions.pay('lot-1');
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/buyer/auctions',
      'GET /v1/buyer/auctions/lot-1/bids',
      'GET /v1/buyer/auctions/lot-1/me',
      'POST /v1/buyer/auctions/lot-1/bids',
      'POST /v1/buyer/auctions/lot-1/retract',
      'POST /v1/buyer/auctions/lot-1/pay',
    ]);
    expect(calls[3]).toMatchObject({ body: { amountCents: 1500, maxBidCents: 4000 }, idempotencyKey: 'bid-1' });
  });
});

describe('buyer.orders / cases / feedback', () => {
  it('maps the order verbs', async () => {
    const { buyer, calls } = makeSpy();
    await buyer.orders.eligibility('p1');
    await buyer.orders.cancel('p1');
    await buyer.orders.markReceived('p1');
    await buyer.orders.openNotReceived('p1', { body: 'never arrived at all' });
    await buyer.orders.exportCsv({ from: '2026-01-01' });
    await buyer.orders.reportSeller('shop name', { reason: 'not_shipped' });
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/buyer/orders/p1/eligibility',
      'POST /v1/buyer/orders/p1/cancel',
      'POST /v1/buyer/orders/p1/received',
      'POST /v1/buyer/orders/p1/inr',
      'GET /v1/buyer/orders/export',
      'POST /v1/buyer/sellers/shop%20name/report',
    ]);
    expect(calls[4]).toMatchObject({ query: { from: '2026-01-01' } });
  });

  it('maps the case verbs', async () => {
    const { buyer, calls } = makeSpy();
    await buyer.cases.list({ status: 'all' });
    await buyer.cases.get('c1');
    await buyer.cases.respond('c1', 'accept');
    await buyer.cases.counter('c1', { amountCents: 1200 });
    await buyer.cases.message('c1', { body: 'hi' });
    await buyer.cases.escalate('c1');
    await buyer.cases.withdraw('c1');
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/buyer/cases',
      'GET /v1/buyer/cases/c1',
      'POST /v1/buyer/cases/c1/respond',
      'POST /v1/buyer/cases/c1/counter',
      'POST /v1/buyer/cases/c1/messages',
      'POST /v1/buyer/cases/c1/escalate',
      'POST /v1/buyer/cases/c1/withdraw',
    ]);
  });

  it('maps the feedback verbs', async () => {
    const { buyer, calls } = makeSpy();
    await buyer.feedback.pending();
    await buyer.feedback.list();
    await buyer.feedback.submit([{ purchaseId: 'p1', rating: 5, ratingShipSpeed: 4 }]);
    await buyer.feedback.revise('r1', { rating: 4 });
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/buyer/feedback/pending',
      'GET /v1/buyer/feedback',
      'POST /v1/buyer/feedback',
      'PATCH /v1/buyer/feedback/r1',
    ]);
    expect(calls[2]).toMatchObject({ body: { reviews: [{ purchaseId: 'p1', rating: 5, ratingShipSpeed: 4 }] } });
  });
});

describe('buyer lists', () => {
  it('maps saved-for-later, total requests, wishlists, history and follows', async () => {
    const { buyer, calls } = makeSpy();
    await buyer.savedForLater.list();
    await buyer.savedForLater.save('ci1');
    await buyer.savedForLater.moveToCart('s1');
    await buyer.savedForLater.remove('s1');
    await buyer.totalRequests.list();
    await buyer.totalRequests.request({ sellerUserId: 'u1' });
    await buyer.totalRequests.cancel('t1');
    await buyer.wishlists.update('w1', { name: 'Gifts' });
    await buyer.wishlists.delete('w1');
    await buyer.wishlists.removeItem('w1', 'slug-1');
    await buyer.wishlists.share('w1', { resetLink: true });
    await buyer.history.removeRecentlyViewed('slug-1');
    await buyer.history.clearRecentlyViewed();
    await buyer.following.sellers();
    await buyer.following.markSeen();
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/buyer/cart/saved',
      'POST /v1/buyer/cart/items/ci1/save-for-later',
      'POST /v1/buyer/cart/saved/s1/move-to-cart',
      'DELETE /v1/buyer/cart/saved/s1',
      'GET /v1/buyer/total-requests',
      'POST /v1/buyer/total-requests',
      'DELETE /v1/buyer/total-requests/t1',
      'PATCH /v1/buyer/wishlists/w1',
      'DELETE /v1/buyer/wishlists/w1',
      'DELETE /v1/buyer/wishlists/w1/items/slug-1',
      'POST /v1/buyer/wishlists/w1/share',
      'DELETE /v1/buyer/recently-viewed/slug-1',
      'DELETE /v1/buyer/recently-viewed',
      'GET /v1/buyer/following/sellers',
      'POST /v1/buyer/following/sellers/seen',
    ]);
    expect(calls[14]).toMatchObject({ body: {} });
  });
});

describe('buyer.browse / account', () => {
  it('sends booleans as strings and drops empty filters', () => {
    expect(browseQuery({ returns: true, sold: false, q: '', minPriceCents: 2500, format: 'auction' })).toEqual({
      returns: 'true',
      sold: 'false',
      minPriceCents: 2500,
      format: 'auction',
    });
  });

  it('maps browse, seller search, sold history and badges', async () => {
    const { buyer, calls } = makeSpy();
    await buyer.browse.listings({ size: 'M', returns: true });
    await buyer.browse.sellers('vintage', 5);
    await buyer.browse.soldHistory('slug-1');
    await buyer.account.badges();
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/buyer/catalog/browse',
      'GET /v1/buyer/catalog/sellers',
      'GET /v1/buyer/catalog/listings/slug-1/sold-history',
      'GET /v1/buyer/badges',
    ]);
    expect(calls[0]).toMatchObject({ query: { size: 'M', returns: 'true' } });
    expect(calls[1]).toMatchObject({ query: { q: 'vintage', limit: 5 } });
  });
});

describe('buyer.landedCost', () => {
  it('GETs the landed-cost quote with the destination as query', async () => {
    const { buyer, calls } = makeSpy();
    await buyer.landedCost('slug 1', { country: 'GB', postalCode: 'SW1A 1AA' });
    expect(calls[0]).toMatchObject({
      method: 'GET',
      path: '/v1/buyer/listings/slug%201/landed-cost',
      query: { country: 'GB', postalCode: 'SW1A 1AA' },
    });
  });
});
