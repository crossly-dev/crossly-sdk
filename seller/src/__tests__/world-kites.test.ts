/**
 * WorldKitesResource reads /v1/world/kites, is on the client, and
 * offers no verb that flies one: a kite is flown on the lawn in
 * the world.
 */
import { describe, expect, it, vi } from 'vitest';
import { WorldKitesResource, createClient } from '../index.js';
import type { HttpClient } from '../client.js';

describe('WorldKitesResource', () => {
  it('get -> GET /v1/world/kites', async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    await new WorldKitesResource(http).get();
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/world/kites' });
  });

  it('has only the read', () => {
    const verbs = Object.getOwnPropertyNames(WorldKitesResource.prototype).filter((n) => n !== 'constructor');
    expect(verbs).toEqual(['get']);
  });

  it('is on the client', () => {
    expect(createClient({ pat: 'crossly_pat_test' }).worldKites).toBeInstanceOf(WorldKitesResource);
  });
});
