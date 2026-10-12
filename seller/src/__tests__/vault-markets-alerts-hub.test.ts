/**
 * VaultMarketsAlertsHubResource hits its literal v1 paths with the right bodies.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsAlertsHubResource } from '../resources/vault-markets-alerts-hub.js';
import type { HttpClient } from '../client.js';

describe('VaultMarketsAlertsHubResource', () => {
  it('maps every verb to its route', async () => {
    const calls: Array<{ method: string; path: string; body?: unknown; query?: unknown }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    const r = new VaultMarketsAlertsHubResource(http);
    await r.get();
    await r.update({ matrix: { price: { telegram: false } }, quietHours: { start: '22:00', end: '08:00', tz: 'UTC' }, telegram: true });
    await r.test('margin_call');
    await r.log(20);
    await r.log();
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault-markets/alert-prefs',
      'PUT /v1/vault-markets/alert-prefs',
      'POST /v1/vault-markets/alert-prefs/test',
      'GET /v1/vault-markets/alert-log',
      'GET /v1/vault-markets/alert-log',
    ]);
    expect(calls[1]!.body).toEqual({ matrix: { price: { telegram: false } }, quietHours: { start: '22:00', end: '08:00', tz: 'UTC' }, telegram: true });
    expect(calls[2]!.body).toEqual({ kind: 'margin_call' });
    expect(calls[3]!.query).toEqual({ limit: 20 });
    expect(calls[4]!.query).toBeUndefined();
  });
});
