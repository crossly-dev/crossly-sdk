/**
 * WorldHallResource reads /v1/world/hall, is on the client, and
 * offers no verb that buys: an exhibit is bought through the market, not
 * the world.
 */
import { describe, expect, it, vi } from 'vitest';
import { WorldHallResource, createClient } from '../index.js';
import type { HttpClient } from '../client.js';

describe('WorldHallResource', () => {
  it('get -> GET /v1/world/hall', async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    await new WorldHallResource(http).get();
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/world/hall' });
  });

  it('lend -> POST /v1/world/hall/loans, withdrawLoan -> DELETE', async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    await new WorldHallResource(http).lend({ vaultItemId: 'v' });
    await new WorldHallResource(http).withdrawLoan('l');
    expect(calls[0]).toMatchObject({ method: 'POST', path: '/v1/world/hall/loans' });
    expect(calls[1]).toMatchObject({ method: 'DELETE', path: '/v1/world/hall/loans/l' });
  });

  it('has the read and the loan desk, nothing that buys', () => {
    const verbs = Object.getOwnPropertyNames(WorldHallResource.prototype).filter((n) => n !== 'constructor');
    expect(verbs).toEqual(['get', 'loans', 'lend', 'withdrawLoan']);
  });

  it('is on the client', () => {
    expect(createClient({ pat: 'crossly_pat_test' }).worldHall).toBeInstanceOf(WorldHallResource);
  });
});
