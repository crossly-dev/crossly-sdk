/**
 * StorefrontShippingResource — route shapes for ship-from / ship-to scope
 * and per-listing customs.
 */
import { describe, expect, it, vi } from 'vitest';
import { createClient, StorefrontShippingResource } from '../index.js';
import type { HttpClient } from '../client.js';

function makeSpy() {
  const calls: Array<{ method: string; path: string; body?: unknown; idempotencyKey?: string }> = [];
  const request = vi.fn(async (opts) => {
    calls.push(opts);
    return {} as unknown;
  });
  return { http: { request } as unknown as HttpClient, calls };
}

describe('StorefrontShippingResource', () => {
  it('get / update / setListingCustoms route shapes', async () => {
    const { http, calls } = makeSpy();
    const r = new StorefrontShippingResource(http);
    await r.get();
    await r.update(
      { shipFrom: { fullName: 'A Seller', street1: '1 High St', city: 'London', zip: 'SW1A 1AA', country: 'GB' } },
      { idempotencyKey: 'idem-1' },
    );
    await r.setListingCustoms('lst 1', { hsCode: '6109.10', restrictedCountries: ['AU'] });

    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/storefront/shipping' });
    expect(calls[1]).toMatchObject({
      method: 'PUT',
      path: '/v1/storefront/shipping',
      body: { shipFrom: { country: 'GB' } },
      idempotencyKey: 'idem-1',
    });
    expect(calls[2]).toMatchObject({
      method: 'PUT',
      path: '/v1/listings/lst%201/customs',
      body: { hsCode: '6109.10', restrictedCountries: ['AU'] },
    });
  });

  it('is attached to the client', () => {
    const client = createClient({ pat: 'crossly_pat_test', fetch: vi.fn() });
    expect(client.storefrontShipping).toBeInstanceOf(StorefrontShippingResource);
  });
});
