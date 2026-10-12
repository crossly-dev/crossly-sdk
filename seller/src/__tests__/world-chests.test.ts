/**
 * WorldChestsResource reads /v1/world/chests, is on the client, and offers no
 * verb that opens a chest: a chest is opened by walking up to it in the world.
 */
import { describe, expect, it, vi } from 'vitest';
import { WorldChestsResource, createClient } from '../index.js';
import type { HttpClient } from '../client.js';

describe('WorldChestsResource', () => {
  it('get -> GET /v1/world/chests', async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    await new WorldChestsResource(http).get();
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/world/chests' });
  });

  it('has only the read', () => {
    const verbs = Object.getOwnPropertyNames(WorldChestsResource.prototype).filter((n) => n !== 'constructor');
    expect(verbs).toEqual(['get']);
  });

  it('is on the client', () => {
    expect(createClient({ pat: 'crossly_pat_test' }).worldChests).toBeInstanceOf(WorldChestsResource);
  });
});
