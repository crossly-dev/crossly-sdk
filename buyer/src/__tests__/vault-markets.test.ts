/**
 * `vaultMarkets` — the read-only "what is my vault worth" surface.
 *
 * Two promises worth pinning: every call is a GET (an agent wallet holding
 * this client cannot place, cancel or sell anything through it), and every
 * method names the scope it needs so a caller can check its token first.
 */
import { describe, it, expect, vi } from 'vitest';
import { createBuyerClient, SCOPE_BY_METHOD, BUYER_SCOPES } from '../index.js';
import { VaultMarketsResource } from '../vault-markets.js';

const TOKEN = 'crossly_oat_test';

function stubFetch(body: unknown) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const impl = vi.fn(async (url: URL | string, reqInit: RequestInit) => {
    calls.push({ url: String(url), init: reqInit });
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

describe('vaultMarkets', () => {
  it('hits the buyer vault-markets paths with GET only', async () => {
    const { impl, calls } = stubFetch({ data: [] });
    const v = createBuyerClient({ token: TOKEN, fetch: impl }).vaultMarkets;
    await v.worth();
    await v.holdings();
    await v.history({ days: 30 });
    await v.watchlist();
    await v.exitQuotes();
    await v.exitQuote('3f1c2b7e-0000-4000-8000-000000000001');
    await v.indexes({ kind: 'category' });
    await v.index('pokemon tcg', { days: 90 });

    expect(calls.map((c) => c.init.method)).toEqual(Array(8).fill('GET'));
    const paths = calls.map((c) => new URL(c.url).pathname + new URL(c.url).search);
    expect(paths).toEqual([
      '/api/v1/buyer/vault-markets/worth',
      '/api/v1/buyer/vault-markets/holdings',
      '/api/v1/buyer/vault-markets/history?days=30',
      '/api/v1/buyer/vault-markets/watchlist',
      '/api/v1/buyer/vault-markets/instant-exit',
      '/api/v1/buyer/vault-markets/instant-exit/3f1c2b7e-0000-4000-8000-000000000001',
      '/api/v1/buyer/vault-markets/indexes?kind=category',
      '/api/v1/buyer/vault-markets/indexes/pokemon%20tcg?days=90',
    ]);
    // Never a body: these are reads.
    for (const c of calls) expect(c.init.body).toBeUndefined();
  });

  it('leaves unset query params off the URL', async () => {
    const { impl, calls } = stubFetch({});
    await createBuyerClient({ token: TOKEN, fetch: impl }).vaultMarkets.history();
    expect(new URL(calls[0]!.url).search).toBe('');
  });

  it('declares a known scope for every method', () => {
    const methods = Object.getOwnPropertyNames(VaultMarketsResource.prototype).filter((m) => m !== 'constructor');
    expect(methods.length).toBe(8);
    for (const m of methods) {
      const scope = SCOPE_BY_METHOD[`vaultMarkets.${m}`];
      expect(scope, m).toBeDefined();
      expect(BUYER_SCOPES).toContain(scope);
    }
  });
});
