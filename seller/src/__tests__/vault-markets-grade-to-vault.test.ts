/**
 * VaultMarketsGradeToVaultResource hits its literal v1 paths, ids encoded,
 * and sends the price confirmation exactly as given.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsGradeToVaultResource } from '../resources/vault-markets-grade-to-vault.js';
import type { HttpClient } from '../client.js';

function harness() {
  const calls: Array<{ method: string; path: string; query?: Record<string, unknown>; body?: unknown }> = [];
  const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
  return { calls, r: new VaultMarketsGradeToVaultResource(http) };
}

describe('VaultMarketsGradeToVaultResource', () => {
  it('maps every call to its route', async () => {
    const { calls, r } = harness();
    await r.list(true);
    await r.candidates();
    await r.start({ source: 'inventory', inventoryItemId: 'i1', runId: 'r1', declaredValueCents: 10_000 });
    await r.get('f/1');
    await r.book('f1', { runId: 'r1' });
    await r.shipped('f1', '1Z999');
    await r.confirmAndList('f1', { priceCents: 30_000, gradeKey: 'psa-10', confirm: true });
    await r.keep('f1');
    await r.cancel('f1');
    await r.evidence('u1');
    await r.addScan('u1', 'c1');
    await r.removeScan('u1', 'e1');
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault-markets/grade-to-vault',
      'GET /v1/vault-markets/grade-to-vault/candidates',
      'POST /v1/vault-markets/grade-to-vault',
      'GET /v1/vault-markets/grade-to-vault/f%2F1',
      'POST /v1/vault-markets/grade-to-vault/f1/book',
      'POST /v1/vault-markets/grade-to-vault/f1/shipped',
      'POST /v1/vault-markets/grade-to-vault/f1/list',
      'POST /v1/vault-markets/grade-to-vault/f1/keep',
      'POST /v1/vault-markets/grade-to-vault/f1/cancel',
      'GET /v1/vault-markets/units/u1/evidence',
      'POST /v1/vault-markets/units/u1/evidence/scans',
      'DELETE /v1/vault-markets/units/u1/evidence/e1',
    ]);
    expect(calls[0]!.query).toEqual({ live: '1' });
    expect(calls[5]!.body).toEqual({ tracking: '1Z999' });
    expect(calls[6]!.body).toEqual({ priceCents: 30_000, gradeKey: 'psa-10', confirm: true });
    expect(calls[10]!.body).toEqual({ captureId: 'c1' });
  });

  it('lists everything when not asked for live flows only', async () => {
    const { calls, r } = harness();
    await r.list();
    expect(calls[0]!.query).toBeUndefined();
  });
});
