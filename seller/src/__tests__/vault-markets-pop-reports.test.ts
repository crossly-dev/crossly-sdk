/**
 * VaultMarketsPopReportsResource reads /v1/vault-markets/pop-reports with the
 * market's bookKey, hangs off `client.vaultMarkets.popReports`, and offers
 * only the read.
 */
import { describe, expect, it, vi } from 'vitest';
import { createClient } from '../index.js';
import { VaultMarketsPopReportsResource } from '../resources/vault-markets-pop-reports.js';
import type { HttpClient } from '../client.js';

const KEY = '11111111-1111-4111-8111-111111111111:NM:psa:9';

describe('VaultMarketsPopReportsResource', () => {
  it('get -> GET /v1/vault-markets/pop-reports?bookKey=', async () => {
    const calls: Array<{ method: string; path: string; query?: Record<string, unknown> }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    await new VaultMarketsPopReportsResource(http).get(KEY);
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/vault-markets/pop-reports', query: { bookKey: KEY } });
  });

  it('has only the read', () => {
    const verbs = Object.getOwnPropertyNames(VaultMarketsPopReportsResource.prototype).filter((n) => n !== 'constructor');
    expect(verbs).toEqual(['get']);
  });

  it('is on the client under vaultMarkets.popReports', () => {
    const vm = createClient({ pat: 'crossly_pat_test' }).vaultMarkets as unknown as { popReports?: unknown };
    expect(vm.popReports).toBeInstanceOf(VaultMarketsPopReportsResource);
  });
});
