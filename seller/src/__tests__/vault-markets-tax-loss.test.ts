/**
 * VaultMarketsTaxLossResource reads its literal v1 path.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsTaxLossResource } from '../resources/vault-markets-tax-loss.js';
import type { HttpClient } from '../client.js';

describe('VaultMarketsTaxLossResource', () => {
  it('maps suggestions() to GET /v1/vault-markets/tax/loss-suggestions', async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    await new VaultMarketsTaxLossResource(http).suggestions();
    expect(calls).toEqual([{ method: 'GET', path: '/v1/vault-markets/tax/loss-suggestions' }]);
  });
});
