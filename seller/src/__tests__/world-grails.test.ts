/**
 * WorldGrailsResource reads /v1/world/grails/match, is on the client, and
 * offers only the match: it reads your wants, it never writes them.
 */
import { describe, expect, it, vi } from 'vitest';
import { WorldGrailsResource, createClient } from '../index.js';
import type { HttpClient } from '../client.js';

describe('WorldGrailsResource', () => {
  it('match -> POST /v1/world/grails/match', async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    await new WorldGrailsResource(http).match({ skuIds: [] });
    expect(calls[0]).toMatchObject({ method: 'POST', path: '/v1/world/grails/match' });
  });

  it('has only the match', () => {
    const verbs = Object.getOwnPropertyNames(WorldGrailsResource.prototype).filter((n) => n !== 'constructor');
    expect(verbs).toEqual(['match']);
  });

  it('is on the client', () => {
    expect(createClient({ pat: 'crossly_pat_test' }).worldGrails).toBeInstanceOf(WorldGrailsResource);
  });
});
