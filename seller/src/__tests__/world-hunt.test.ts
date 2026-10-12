/**
 * WorldHuntResource calls the documented /v1/world/hunt routes, is on the
 * client, and offers no verb that takes a key or moves money: a key is picked
 * up by walking to it in the world. Spies on `http.request`; no network.
 */
import { describe, expect, it, vi } from 'vitest';
import { WorldHuntResource, createClient } from '../index.js';
import type { HttpClient } from '../client.js';

function makeSpy() {
  const calls: Array<{ method: string; path: string; body?: unknown }> = [];
  const request = vi.fn(async (opts) => {
    calls.push(opts);
    return {} as unknown;
  });
  return { http: { request } as unknown as HttpClient, calls };
}

describe('WorldHuntResource', () => {
  it.each([
    ['mine', 'GET', '/v1/world/hunt'],
    ['scoreboard', 'GET', '/v1/world/hunt/scoreboard'],
    ['start', 'POST', '/v1/world/hunt/start'],
  ] as const)('%s -> %s %s', async (method, verb, path) => {
    const { http, calls } = makeSpy();
    await new WorldHuntResource(http)[method]();
    expect(calls[0]).toMatchObject({ method: verb, path });
  });

  it('has no verb that takes a key or spends', () => {
    const verbs = Object.getOwnPropertyNames(WorldHuntResource.prototype).filter((n) => n !== 'constructor');
    expect(verbs.sort()).toEqual(['mine', 'scoreboard', 'start']);
  });

  it('is on the client', () => {
    expect(createClient({ pat: 'crossly_pat_test', fetch: vi.fn() }).worldHunt).toBeInstanceOf(WorldHuntResource);
  });
});
