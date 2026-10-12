/**
 * WorldArcadeResource calls the documented /v1/world/arcade route, is on the
 * client, and is read-only: games are played at their cabinets in the world.
 * Spies on `http.request`; no network.
 */
import { describe, expect, it, vi } from 'vitest';
import { WorldArcadeResource, createClient } from '../index.js';
import type { HttpClient } from '../client.js';

function makeSpy() {
  const calls: Array<{ method: string; path: string; body?: unknown }> = [];
  const request = vi.fn(async (opts) => {
    calls.push(opts);
    return {} as unknown;
  });
  return { http: { request } as unknown as HttpClient, calls };
}

describe('WorldArcadeResource', () => {
  it('get -> GET /v1/world/arcade', async () => {
    const { http, calls } = makeSpy();
    await new WorldArcadeResource(http).get();
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/world/arcade' });
  });

  it('is read-only', () => {
    const verbs = Object.getOwnPropertyNames(WorldArcadeResource.prototype).filter((n) => n !== 'constructor');
    expect(verbs).toEqual(['get']);
  });

  it('is on the client', () => {
    expect(createClient({ pat: 'crossly_pat_test', fetch: vi.fn() }).worldArcade).toBeInstanceOf(WorldArcadeResource);
  });
});
