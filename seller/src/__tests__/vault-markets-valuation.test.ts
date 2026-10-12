/**
 * VaultMarketsValuationResource hits its literal v1 paths, ids encoded, sends
 * the preview's fields on the query string and the hash to verify.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsValuationResource } from '../resources/vault-markets-valuation.js';
import type { HttpClient } from '../client.js';

function harness() {
  const calls: Array<{ method: string; path: string; query?: Record<string, unknown>; body?: unknown }> = [];
  const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
  return { calls, r: new VaultMarketsValuationResource(http) };
}

describe('VaultMarketsValuationResource', () => {
  it('maps every call to its route', async () => {
    const { calls, r } = harness();
    await r.preview({ purpose: 'insurance', asOf: '2026-09-30' });
    await r.issue({ purpose: 'appraisal', preparedFor: 'Estate of A. Collector' });
    await r.list(5);
    await r.get('s/1');
    await r.verify('s1', 'ab'.repeat(32));
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault-markets/valuation-statements/preview',
      'POST /v1/vault-markets/valuation-statements',
      'GET /v1/vault-markets/valuation-statements',
      'GET /v1/vault-markets/valuation-statements/s%2F1',
      'GET /v1/vault-markets/valuation-statements/s1/verify',
    ]);
    expect(calls[0]!.query).toEqual({ purpose: 'insurance', asOf: '2026-09-30' });
    expect(calls[1]!.body).toEqual({ purpose: 'appraisal', preparedFor: 'Estate of A. Collector' });
    expect(calls[2]!.query).toEqual({ limit: 5 });
    expect(calls[4]!.query).toEqual({ hash: 'ab'.repeat(32) });
  });

  it('sends no query when there is nothing to send', async () => {
    const { calls, r } = harness();
    await r.list();
    await r.verify('s1');
    expect(calls[0]!.query).toBeUndefined();
    expect(calls[1]!.query).toBeUndefined();
  });
});
