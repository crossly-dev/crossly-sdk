/**
 * VaultMarketsSetGoalsResource hits its literal v1 paths, ids encoded, and
 * sends the basket plan's numbers on the query string.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsSetGoalsResource } from '../resources/vault-markets-set-goals.js';
import type { HttpClient } from '../client.js';

function harness() {
  const calls: Array<{ method: string; path: string; query?: Record<string, unknown>; body?: unknown }> = [];
  const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
  return { calls, r: new VaultMarketsSetGoalsResource(http) };
}

describe('VaultMarketsSetGoalsResource', () => {
  it('maps every call to its route', async () => {
    const { calls, r } = harness();
    await r.sets('fleer');
    await r.list();
    await r.create({ category: 'trading-cards', brandSlug: 'fleer', modelSlug: '1986-basketball' });
    await r.get('g/1');
    await r.update('g1', { gradeMode: 'exact', gradeKey: 'psa:10' });
    await r.remove('g1');
    await r.basketPlan('g1', { budgetCents: 50_000 });
    await r.placeBasket('g1', { budgetCents: 50_000, funding: 'custodian' });
    await r.cancelBasket('g1');
    await r.baskets('g1', 5);
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault-markets/set-goals/sets',
      'GET /v1/vault-markets/set-goals',
      'POST /v1/vault-markets/set-goals',
      'GET /v1/vault-markets/set-goals/g%2F1',
      'PATCH /v1/vault-markets/set-goals/g1',
      'DELETE /v1/vault-markets/set-goals/g1',
      'GET /v1/vault-markets/set-goals/g1/basket-plan',
      'POST /v1/vault-markets/set-goals/g1/basket',
      'POST /v1/vault-markets/set-goals/g1/basket/cancel',
      'GET /v1/vault-markets/set-goals/g1/baskets',
    ]);
    expect(calls[0]!.query).toEqual({ q: 'fleer' });
    expect(calls[9]!.query).toEqual({ limit: 5 });
  });

  it('puts the plan on the query string, the chosen pieces comma-joined', async () => {
    const { calls, r } = harness();
    await r.basketPlan('g1', { budgetCents: 12_345, maxBpsOverMark: 300, skuIds: ['a', 'b'] });
    await r.basketPlan('g1', { budgetCents: 100 });
    expect(calls[0]!.query).toEqual({ budgetCents: 12_345, maxBpsOverMark: 300, skuIds: 'a,b' });
    expect(calls[1]!.query).toEqual({ budgetCents: 100 });
  });
});
