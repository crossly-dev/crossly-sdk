/**
 * WorldFirefliesResource reads /v1/world/fireflies, is on the client, and
 * offers no verb that catches one: a firefly is caught by walking up to it in
 * the world.
 */
import { describe, expect, it, vi } from 'vitest';
import { WorldFirefliesResource, createClient } from '../index.js';
import type { HttpClient } from '../client.js';

describe('WorldFirefliesResource', () => {
  it('get -> GET /v1/world/fireflies', async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    await new WorldFirefliesResource(http).get();
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/world/fireflies' });
  });

  it('has only the read', () => {
    const verbs = Object.getOwnPropertyNames(WorldFirefliesResource.prototype).filter((n) => n !== 'constructor');
    expect(verbs).toEqual(['get']);
  });

  it('is on the client', () => {
    expect(createClient({ pat: 'crossly_pat_test' }).worldFireflies).toBeInstanceOf(WorldFirefliesResource);
  });
});
