/**
 * WorldProvenanceResource reads /v1/world/provenance, is on the client, and
 * offers only the read.
 */
import { describe, expect, it, vi } from 'vitest';
import { WorldProvenanceResource, createClient } from '../index.js';
import type { HttpClient } from '../client.js';

describe('WorldProvenanceResource', () => {
  it('list -> GET /v1/world/provenance', async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    await new WorldProvenanceResource(http).list();
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/world/provenance' });
  });

  it('has only the list', () => {
    const verbs = Object.getOwnPropertyNames(WorldProvenanceResource.prototype).filter((n) => n !== 'constructor');
    expect(verbs).toEqual(['list']);
  });

  it('is on the client', () => {
    expect(createClient({ pat: 'crossly_pat_test' }).worldProvenance).toBeInstanceOf(WorldProvenanceResource);
  });
});
