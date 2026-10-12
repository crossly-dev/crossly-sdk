/**
 * WorldResource must call the documented /v1/world/* routes, and must not
 * offer any verb that moves money (buy, mint, shake): those stay on
 * crossly.net. Spies on `http.request`; no network.
 */
import { describe, expect, it, vi } from 'vitest';
import { WorldResource, createClient } from '../index.js';
import type { HttpClient } from '../client.js';

function makeSpy() {
  const calls: Array<{ method: string; path: string; body?: unknown; query?: unknown; idempotencyKey?: string }> = [];
  const request = vi.fn(async (opts) => {
    calls.push(opts);
    return {} as unknown;
  });
  return { http: { request } as unknown as HttpClient, calls };
}

describe('WorldResource', () => {
  it.each([
    ['wallet', [], 'GET', '/v1/world/wallet'],
    ['quests', [], 'GET', '/v1/world/quests'],
    ['crew', [], 'GET', '/v1/world/crew'],
    ['loadout', [], 'GET', '/v1/world/avatar/loadout'],
    ['loadout', ['u-1'], 'GET', '/v1/world/avatar/loadout/u-1'],
    ['stockWearables', [], 'GET', '/v1/world/avatar/stock'],
    ['authoredWearables', [], 'GET', '/v1/world/avatar/wearables'],
    ['cosmBalance', [], 'GET', '/v1/world/cosm/balance'],
    ['cosmInventory', [], 'GET', '/v1/world/cosm/inventory'],
    ['decorCatalogue', [], 'GET', '/v1/world/decor/catalogue'],
    ['myDecor', [], 'GET', '/v1/world/decor/mine'],
    ['decorInventory', [], 'GET', '/v1/world/decor/inventory'],
    ['interactiveCatalogue', [], 'GET', '/v1/world/interactive/catalogue'],
    ['interactiveDesigns', [], 'GET', '/v1/world/interactive/designs'],
    ['tradeTableListings', [], 'GET', '/v1/world/trade-tables/listings'],
    ['binder', [], 'GET', '/v1/world/trade-tables/binder'],
    ['friends', [], 'GET', '/v1/world/friends'],
    ['fitValue', [], 'GET', '/v1/world/fit-value'],
    ['fitStats', [], 'GET', '/v1/world/fits/stats'],
    ['bestDressed', [], 'GET', '/v1/world/best-dressed'],
    ['streaks', [], 'GET', '/v1/world/streaks'],
    ['autoShop', [], 'GET', '/v1/world/auto-shop'],
    ['leaveCrew', [], 'POST', '/v1/world/crews/leave'],
  ] as const)('%s(%j) → %s %s', async (method, args, verb, path) => {
    const { http, calls } = makeSpy();
    const r = new WorldResource(http) as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
    await r[method](...args);
    expect(calls[0]).toMatchObject({ method: verb, path });
  });

  it('closet and cosmetics pass their filters as query', async () => {
    const { http, calls } = makeSpy();
    const r = new WorldResource(http);
    await r.closet({ limit: 5, offset: 10 });
    await r.cosmetics({ tier: 'earned', slot: 'avatar_head' });
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/world/avatar/closet', query: { limit: '5', offset: '10' } });
    expect(calls[1]).toMatchObject({ method: 'GET', path: '/v1/world/cosm/cosmetics', query: { tier: 'earned', slot: 'avatar_head' } });
  });

  it('writes send their bodies to the right routes', async () => {
    const { http, calls } = makeSpy();
    const r = new WorldResource(http);
    await r.wearPin(null);
    await r.createCrew({ name: 'Night Owls', tag: 'OWL' }, { idempotencyKey: 'k1' });
    await r.joinCrew('abcdefgh');
    await r.inviteFriend('f-1', 'main-street');
    await r.equip({ cosmeticId: 'c-1' });
    await r.unequip('avatar_head');
    await r.setAutoShop(false);
    expect(calls).toEqual([
      expect.objectContaining({ method: 'PUT', path: '/v1/world/quests/pin', body: { pin: null } }),
      expect.objectContaining({ method: 'POST', path: '/v1/world/crews', body: { name: 'Night Owls', tag: 'OWL' }, idempotencyKey: 'k1' }),
      expect.objectContaining({ method: 'POST', path: '/v1/world/crews/join', body: { code: 'abcdefgh' } }),
      expect.objectContaining({ method: 'POST', path: '/v1/world/friends/f-1/invite', body: { slug: 'main-street' } }),
      expect.objectContaining({ method: 'POST', path: '/v1/world/avatar/equip', body: { cosmeticId: 'c-1' } }),
      expect.objectContaining({ method: 'POST', path: '/v1/world/avatar/unequip', body: { slot: 'avatar_head' } }),
      expect.objectContaining({ method: 'PATCH', path: '/v1/world/auto-shop', body: { enabled: false } }),
    ]);
  });

  it('offers no money verb', () => {
    const names = Object.getOwnPropertyNames(WorldResource.prototype);
    for (const n of names) expect(n).not.toMatch(/buy|mint|shake|pay|checkout|withdraw|spend/i);
  });

  it('is wired on the client as `world`', () => {
    const client = createClient({ pat: 'crossly_pat_test', fetch: vi.fn() });
    expect(client.world).toBeInstanceOf(WorldResource);
  });
});
