/**
 * VaultMarketsReceiptTokensResource hits its literal v1 paths, ids encoded.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsReceiptTokensResource } from '../resources/vault-markets-receipt-tokens.js';
import type { HttpClient } from '../client.js';

describe('VaultMarketsReceiptTokensResource', () => {
  it('maps every verb to its route', async () => {
    const calls: Array<{ method: string; path: string; body?: unknown }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    const r = new VaultMarketsReceiptTokensResource(http);
    await r.units();
    await r.get('t/1');
    await r.byMint('Mint1');
    await r.export({ vaultItemId: 'u1', wallet: 'W1', acceptTerms: 'rt-1' });
    await r.confirm('t1', { signature: 'S' });
    await r.redeem('t1', { wallet: 'W1' });
    await r.confirmRedeem('t1');
    await r.wallets();
    await r.allowWallet({ wallet: 'W1' });
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault/receipt-tokens',
      'GET /v1/vault/receipt-tokens/t%2F1',
      'GET /v1/vault/receipt-tokens/by-mint/Mint1',
      'POST /v1/vault/receipt-tokens/export',
      'POST /v1/vault/receipt-tokens/t1/confirm',
      'POST /v1/vault/receipt-tokens/t1/redeem',
      'POST /v1/vault/receipt-tokens/t1/redeem/confirm',
      'GET /v1/vault/receipt-tokens/wallets',
      'POST /v1/vault/receipt-tokens/wallets/allow',
    ]);
    expect(calls[3]!.body).toEqual({ vaultItemId: 'u1', wallet: 'W1', acceptTerms: 'rt-1' });
    expect(calls[8]!.body).toEqual({ wallet: 'W1' });
  });
});
