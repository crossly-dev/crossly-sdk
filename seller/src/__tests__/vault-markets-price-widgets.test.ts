/**
 * VaultMarketsPriceWidgetsResource hits its literal v1 paths, encodes ids, and has
 * no verb that could trade.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsPriceWidgetsResource } from '../resources/vault-markets-price-widgets.js';
import type { HttpClient } from '../client.js';

describe('VaultMarketsPriceWidgetsResource', () => {
  it('maps every verb to its route', async () => {
    const calls: Array<{ method: string; path: string; body?: unknown }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    const r = new VaultMarketsPriceWidgetsResource(http);
    await r.list();
    await r.create({ kind: 'mark', bookKey: 'v:Used:psa:10', affiliateCodeId: null });
    await r.preview({ kind: 'index', indexSlug: 'crossly-50' });
    await r.get('a/b');
    await r.update('w1', { theme: 'dark' });
    await r.delete('w1');
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault-markets/price-widgets',
      'POST /v1/vault-markets/price-widgets',
      'POST /v1/vault-markets/price-widgets/preview',
      'GET /v1/vault-markets/price-widgets/a%2Fb',
      'PATCH /v1/vault-markets/price-widgets/w1',
      'DELETE /v1/vault-markets/price-widgets/w1',
    ]);
    expect(calls[1]!.body).toEqual({ kind: 'mark', bookKey: 'v:Used:psa:10', affiliateCodeId: null });
    expect(calls[4]!.body).toEqual({ theme: 'dark' });
  });

  it('has no verb that trades', () => {
    const verbs = Object.getOwnPropertyNames(VaultMarketsPriceWidgetsResource.prototype);
    expect(verbs.filter((v) => /order|buy|sell|place|trade/i.test(v))).toEqual([]);
  });
});
