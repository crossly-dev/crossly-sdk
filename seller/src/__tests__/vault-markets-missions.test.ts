/**
 * VaultMarketsMissionsResource hits its literal v1 paths, and rides on the
 * paper resource as `paper.missions`.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsMissionsResource } from '../resources/vault-markets-missions.js';
import { VaultMarketsPaperResource } from '../resources/vault-markets-paper.js';
import type { HttpClient } from '../client.js';

describe('VaultMarketsMissionsResource', () => {
  it('maps every verb to its route', async () => {
    const calls: Array<{ method: string; path: string; body?: unknown }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    const r = new VaultMarketsMissionsResource(http);
    await r.list();
    await r.answerMarkCheck({ bookKey: 'k', quality: 'B' });
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault-markets/paper/missions',
      'POST /v1/vault-markets/paper/missions/mark-check',
    ]);
    expect(calls[1]!.body).toEqual({ bookKey: 'k', quality: 'B' });
  });

  it('is reachable as paper.missions', async () => {
    const http = { request: vi.fn(async () => ({})) } as unknown as HttpClient;
    const paper = new VaultMarketsPaperResource(http);
    expect(paper.missions).toBeInstanceOf(VaultMarketsMissionsResource);
    await paper.missions.list();
    expect((http.request as ReturnType<typeof vi.fn>).mock.calls[0]![0]).toMatchObject({ method: 'GET', path: '/v1/vault-markets/paper/missions' });
  });
});
