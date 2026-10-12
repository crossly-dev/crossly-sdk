/**
 * WorldAuroraResource reads /v1/world/aurora, is on the client, and
 * offers nothing but the read: the sky only shows sales.
 */
import { describe, expect, it, vi } from 'vitest';
import { WorldAuroraResource, createClient } from '../index.js';
import type { HttpClient } from '../client.js';

describe('WorldAuroraResource', () => {
  it('get -> GET /v1/world/aurora', async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    await new WorldAuroraResource(http).get();
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/world/aurora' });
  });

  it('has only the read', () => {
    const verbs = Object.getOwnPropertyNames(WorldAuroraResource.prototype).filter((n) => n !== 'constructor');
    expect(verbs).toEqual(['get']);
  });

  it('is on the client', () => {
    expect(createClient({ pat: 'crossly_pat_test' }).worldAurora).toBeInstanceOf(WorldAuroraResource);
  });
});
