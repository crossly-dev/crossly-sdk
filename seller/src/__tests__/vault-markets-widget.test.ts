/**
 * VaultMarketsWidgetResource hits its literal v1 paths with the right bodies.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsWidgetResource } from '../resources/vault-markets-widget.js';
import type { HttpClient } from '../client.js';

describe('VaultMarketsWidgetResource', () => {
  it('maps every verb to its route', async () => {
    const calls: Array<{ method: string; path: string; body?: unknown; query?: unknown }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    const r = new VaultMarketsWidgetResource(http);
    const key = '3f1c2b7e-0000-4000-8000-000000000001:near_mint:psa:10';
    await r.summary(key);
    await r.summary();
    await r.tokens();
    await r.mintToken({ deviceName: 'iPhone 15', installId: 'abc123def' });
    await r.revokeToken('11111111-1111-4111-8111-111111111111');
    await r.revokeAllTokens();
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault-markets/widget/summary',
      'GET /v1/vault-markets/widget/summary',
      'GET /v1/vault-markets/widget/tokens',
      'POST /v1/vault-markets/widget/tokens',
      'DELETE /v1/vault-markets/widget/tokens/11111111-1111-4111-8111-111111111111',
      'DELETE /v1/vault-markets/widget/tokens',
    ]);
    expect(calls[0]!.query).toEqual({ key });
    expect(calls[1]!.query).toBeUndefined();
    expect(calls[3]!.body).toEqual({ deviceName: 'iPhone 15', installId: 'abc123def' });
  });
});
