/**
 * VaultMarketsUnitStoryResource hits its literal v1 paths, ids encoded.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsUnitStoryResource } from '../resources/vault-markets-unit-story.js';
import type { HttpClient } from '../client.js';

describe('VaultMarketsUnitStoryResource', () => {
  it('maps every read to its route', async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    const r = new VaultMarketsUnitStoryResource(http);
    await r.get('u/1');
    await r.positionUnits('p1');
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault-markets/units/u%2F1/story',
      'GET /v1/vault-markets/positions/p1/units',
    ]);
  });
});
