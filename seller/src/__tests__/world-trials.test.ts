/**
 * WorldTrialsResource calls the documented /v1/world/trials routes, is on the
 * client, and offers no verb that records a lap or moves money: a lap is timed
 * by riding the course in the world. Spies on `http.request`; no network.
 */
import { describe, expect, it, vi } from 'vitest';
import { WorldTrialsResource, createClient } from '../index.js';
import type { HttpClient } from '../client.js';

function makeSpy() {
  const calls: Array<{ method: string; path: string; body?: unknown }> = [];
  const request = vi.fn(async (opts) => {
    calls.push(opts);
    return {} as unknown;
  });
  return { http: { request } as unknown as HttpClient, calls };
}

describe('WorldTrialsResource', () => {
  it('mine -> GET /v1/world/trials/mine', async () => {
    const { http, calls } = makeSpy();
    await new WorldTrialsResource(http).mine();
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/world/trials/mine' });
  });

  it('leaderboard -> GET /v1/world/trials/:course/leaderboard, course 1 by default, encoded', async () => {
    const { http, calls } = makeSpy();
    const r = new WorldTrialsResource(http);
    await r.leaderboard();
    await r.leaderboard('a b');
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/world/trials/commons-loop/leaderboard' });
    expect(calls[1]).toMatchObject({ method: 'GET', path: '/v1/world/trials/a%20b/leaderboard' });
  });

  it('has no verb that records a lap or spends', () => {
    const verbs = Object.getOwnPropertyNames(WorldTrialsResource.prototype).filter((n) => n !== 'constructor');
    expect(verbs.sort()).toEqual(['leaderboard', 'mine']);
  });

  it('is on the client', () => {
    expect(createClient({ pat: 'crossly_pat_test', fetch: vi.fn() }).worldTrials).toBeInstanceOf(WorldTrialsResource);
  });
});
