/**
 * WorldWishesResource reads /v1/world/wishes, is on the client, and offers no
 * verb that makes a wish: a wish is a coin tossed at the fountain in the world.
 */
import { describe, expect, it, vi } from 'vitest';
import { WorldWishesResource, createClient } from '../index.js';
import type { HttpClient } from '../client.js';

describe('WorldWishesResource', () => {
  it('get -> GET /v1/world/wishes', async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    await new WorldWishesResource(http).get();
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/world/wishes' });
  });

  it('has only the read', () => {
    const verbs = Object.getOwnPropertyNames(WorldWishesResource.prototype).filter((n) => n !== 'constructor');
    expect(verbs).toEqual(['get']);
  });

  it('is on the client', () => {
    expect(createClient({ pat: 'crossly_pat_test' }).worldWishes).toBeInstanceOf(WorldWishesResource);
  });
});
