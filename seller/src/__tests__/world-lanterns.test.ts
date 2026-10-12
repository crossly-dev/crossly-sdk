/**
 * WorldLanternsResource reads /v1/world/lanterns, is on the client, and
 * offers no verb that releases one: a lantern is released at the stand in
 * the world.
 */
import { describe, expect, it, vi } from 'vitest';
import { WorldLanternsResource, createClient } from '../index.js';
import type { HttpClient } from '../client.js';

describe('WorldLanternsResource', () => {
  it('get -> GET /v1/world/lanterns', async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    await new WorldLanternsResource(http).get();
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/world/lanterns' });
  });

  it('has only the read', () => {
    const verbs = Object.getOwnPropertyNames(WorldLanternsResource.prototype).filter((n) => n !== 'constructor');
    expect(verbs).toEqual(['get']);
  });

  it('is on the client', () => {
    expect(createClient({ pat: 'crossly_pat_test' }).worldLanterns).toBeInstanceOf(WorldLanternsResource);
  });
});
