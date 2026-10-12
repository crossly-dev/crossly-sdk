/**
 * VaultMarketsVaultSuggestResource hits its literal v1 paths, the item id
 * encoded, and sends `limit` only when given.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsVaultSuggestResource } from '../resources/vault-markets-vault-suggest.js';
import type { HttpClient } from '../client.js';

function harness() {
  const calls: Array<{ method: string; path: string; query?: Record<string, unknown> }> = [];
  const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
  return { calls, r: new VaultMarketsVaultSuggestResource(http) };
}

describe('VaultMarketsVaultSuggestResource', () => {
  it('maps every call to its route', async () => {
    const { calls, r } = harness();
    await r.list(10);
    await r.list();
    await r.forItem('i/1');
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault-markets/vault-suggestions',
      'GET /v1/vault-markets/vault-suggestions',
      'GET /v1/vault-markets/vault-suggestions/items/i%2F1',
    ]);
    expect(calls[0]!.query).toEqual({ limit: '10' });
    expect(calls[1]!.query).toBeUndefined();
  });
});
