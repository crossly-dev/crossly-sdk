/**
 * BrandDropsResource — route shapes for /v1/brand-drops.
 */
import { describe, expect, it, vi } from 'vitest';
import { createClient, BrandDropsResource } from '../index.js';
import type { HttpClient } from '../client.js';

function makeSpy() {
  const calls: Array<{ method: string; path: string; body?: unknown; query?: unknown; idempotencyKey?: string }> = [];
  const request = vi.fn(async (opts) => {
    calls.push(opts);
    return {} as unknown;
  });
  return { http: { request } as unknown as HttpClient, calls };
}

describe('BrandDropsResource', () => {
  it('reads: partner / list / get / listings', async () => {
    const { http, calls } = makeSpy();
    const r = new BrandDropsResource(http);
    await r.partner();
    await r.list({ status: 'scheduled', limit: 10 });
    await r.get('d 1');
    await r.listings('d1');
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/brand-drops/partner' });
    expect(calls[1]).toMatchObject({ method: 'GET', path: '/v1/brand-drops', query: { status: 'scheduled', limit: 10 } });
    expect(calls[2]).toMatchObject({ method: 'GET', path: '/v1/brand-drops/d%201' });
    expect(calls[3]).toMatchObject({ method: 'GET', path: '/v1/brand-drops/d1/listings' });
  });

  it('writes: create / update / submit / schedule / cancel / setListings', async () => {
    const { http, calls } = makeSpy();
    const r = new BrandDropsResource(http);
    await r.create({ name: 'Fall capsule', dropAt: '2026-11-01T18:00:00.000Z' }, { idempotencyKey: 'k1' });
    await r.update('d1', { name: 'Fall capsule II' });
    await r.submit('d1');
    await r.schedule('d1');
    await r.cancel('d1');
    await r.setListings('d1', ['l1', 'l2'], { idempotencyKey: 'k2' });
    expect(calls[0]).toMatchObject({ method: 'POST', path: '/v1/brand-drops', body: { name: 'Fall capsule' }, idempotencyKey: 'k1' });
    expect(calls[1]).toMatchObject({ method: 'PATCH', path: '/v1/brand-drops/d1', body: { name: 'Fall capsule II' } });
    expect(calls[2]).toMatchObject({ method: 'PATCH', body: { status: 'pending_review' } });
    expect(calls[3]).toMatchObject({ method: 'PATCH', body: { status: 'scheduled' } });
    expect(calls[4]).toMatchObject({ method: 'PATCH', body: { status: 'cancelled' } });
    expect(calls[5]).toMatchObject({ method: 'PUT', path: '/v1/brand-drops/d1/listings', body: { listingIds: ['l1', 'l2'] }, idempotencyKey: 'k2' });
  });

  it('is on the client', () => {
    const c = createClient({ pat: 'crossly_pat_test', fetch: vi.fn() });
    expect(c.brandDrops).toBeInstanceOf(BrandDropsResource);
  });
});
