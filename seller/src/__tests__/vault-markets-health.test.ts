/**
 * VaultMarketsHealthResource hits its literal v1 paths and sends the what-if
 * on the query string.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsHealthResource } from '../resources/vault-markets-health.js';
import type { HttpClient } from '../client.js';

function harness() {
  const calls: Array<{ method: string; path: string; query?: Record<string, unknown>; body?: unknown }> = [];
  const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
  return { calls, r: new VaultMarketsHealthResource(http) };
}

describe('VaultMarketsHealthResource', () => {
  it('maps every call to its route', async () => {
    const { calls, r } = harness();
    await r.get();
    await r.whatIf({ bookKey: 'v1:near_mint:psa:10', moveBps: -2_000 });
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault-markets/health',
      'GET /v1/vault-markets/health/what-if',
    ]);
    expect(calls[0]!.query).toBeUndefined();
    expect(calls[1]!.query).toEqual({ bookKey: 'v1:near_mint:psa:10', moveBps: -2_000 });
    expect(calls[1]!.body).toBeUndefined();
  });
});
