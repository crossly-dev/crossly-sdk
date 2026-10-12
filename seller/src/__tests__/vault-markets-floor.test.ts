/**
 * VaultMarketsFloorResource reads /v1/vault-markets/world/floor, hangs off
 * `client.vaultMarkets.floor`, and offers nothing but the read: nothing is
 * traded on the Trading Floor.
 */
import { describe, expect, it, vi } from 'vitest';
import { createClient } from '../index.js';
import { VaultMarketsFloorResource } from '../resources/vault-markets-floor.js';
import type { HttpClient } from '../client.js';

describe('VaultMarketsFloorResource', () => {
  it('get -> GET /v1/vault-markets/world/floor', async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    await new VaultMarketsFloorResource(http).get();
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/vault-markets/world/floor' });
  });

  it('has only the read', () => {
    const verbs = Object.getOwnPropertyNames(VaultMarketsFloorResource.prototype).filter((n) => n !== 'constructor');
    expect(verbs).toEqual(['get']);
  });

  it('is on the client under vaultMarkets.floor', () => {
    const vm = createClient({ pat: 'crossly_pat_test' }).vaultMarkets as unknown as { floor?: unknown };
    expect(vm.floor).toBeInstanceOf(VaultMarketsFloorResource);
  });
});
