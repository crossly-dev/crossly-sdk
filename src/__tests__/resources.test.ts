/**
 * Resource-shape invariants — each resource method must call HttpClient
 * with the documented URL + HTTP method. This is the compile-time
 * "matches server route" pin: if a route moves on the server, the SDK
 * ships broken until this test is updated.
 *
 * We spy on `http.request` and assert the shape of the request object
 * without ever making a network call.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  AccountResource,
  ActionLogResource,
  CustomersResource,
  ImportsResource,
  InventoryResource,
  ListingsResource,
  OrdersResource,
  PolicyPresetsResource,
  ReturnsResource,
  SalesResource,
  UnitsResource,
} from '../index.js';
import type { HttpClient } from '../client.js';

function makeSpy(): {
  http: HttpClient;
  calls: Array<{ method: string; path: string; body?: unknown; query?: unknown; idempotencyKey?: string }>;
} {
  const calls: Array<{ method: string; path: string; body?: unknown; query?: unknown; idempotencyKey?: string }> = [];
  const request = vi.fn(async (opts) => {
    calls.push(opts);
    return {} as unknown;
  });
  // Only `.request` is used by the resources — cast to satisfy the type.
  const http = { request } as unknown as HttpClient;
  return { http, calls };
}

describe('InventoryResource', () => {
  it('list → GET /v1/inventory with query params', async () => {
    const { http, calls } = makeSpy();
    const r = new InventoryResource(http);
    await r.list({ search: 'nike', status: 'active' });
    expect(calls[0]).toMatchObject({
      method: 'GET',
      path: '/v1/inventory',
      query: { search: 'nike', status: 'active' },
    });
  });

  it('get(id) → GET /v1/inventory/:id (id url-encoded)', async () => {
    const { http, calls } = makeSpy();
    await new InventoryResource(http).get('abc def');
    expect(calls[0]).toMatchObject({
      method: 'GET',
      path: '/v1/inventory/abc%20def',
    });
  });

  it('create → POST /v1/inventory with body + idempotency-key', async () => {
    const { http, calls } = makeSpy();
    await new InventoryResource(http).create({ title: 't' }, { idempotencyKey: 'idem-1' });
    expect(calls[0]).toMatchObject({
      method: 'POST',
      path: '/v1/inventory',
      body: { title: 't' },
      idempotencyKey: 'idem-1',
    });
  });

  it('update(id) → PATCH /v1/inventory/:id', async () => {
    const { http, calls } = makeSpy();
    await new InventoryResource(http).update('id1', { title: 'x' });
    expect(calls[0]).toMatchObject({ method: 'PATCH', path: '/v1/inventory/id1' });
  });

  it('archive(id) → DELETE /v1/inventory/:id', async () => {
    const { http, calls } = makeSpy();
    await new InventoryResource(http).archive('id1');
    expect(calls[0]).toMatchObject({ method: 'DELETE', path: '/v1/inventory/id1' });
  });

  it('facets / ids / labels are GETs', async () => {
    const { http, calls } = makeSpy();
    const r = new InventoryResource(http);
    await r.facets(); await r.ids({ status: 'active' }); await r.labels();
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/inventory/facets' });
    expect(calls[1]).toMatchObject({ method: 'GET', path: '/v1/inventory/ids' });
    expect(calls[2]).toMatchObject({ method: 'GET', path: '/v1/inventory/labels' });
  });
});

describe('ListingsResource', () => {
  it('list / get / create / update / delist route shapes', async () => {
    const { http, calls } = makeSpy();
    const r = new ListingsResource(http);
    await r.list({ status: 'active' });
    await r.get('l1');
    await r.create({ inventoryItemId: 'i1', platforms: ['poshmark'] });
    await r.update('l1', { price: 10 });
    await r.delist('l1', { platforms: ['poshmark'] });
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/listings' });
    expect(calls[1]).toMatchObject({ method: 'GET', path: '/v1/listings/l1' });
    expect(calls[2]).toMatchObject({ method: 'POST', path: '/v1/listings' });
    expect(calls[3]).toMatchObject({ method: 'PATCH', path: '/v1/listings/l1' });
    expect(calls[4]).toMatchObject({
      method: 'DELETE',
      path: '/v1/listings/l1',
      query: { platforms: ['poshmark'] },
    });
  });

  it('bulk-* endpoints all POST to the right paths', async () => {
    const { http, calls } = makeSpy();
    const r = new ListingsResource(http);
    await r.bulkRelist({});
    await r.bulkCrosspost({});
    await r.bulkDelist({});
    await r.bulkDelete({});
    await r.bulkUpdate({});
    await r.bulkCheckStatus({});
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'POST /v1/listings/bulk-relist',
      'POST /v1/listings/bulk-crosspost',
      'POST /v1/listings/bulk-delist',
      'POST /v1/listings/bulk-delete',
      'POST /v1/listings/bulk-update',
      'POST /v1/listings/bulk-check-status',
    ]);
  });
});

describe('OrdersResource', () => {
  it('list / get / submitTracking / refund', async () => {
    const { http, calls } = makeSpy();
    const r = new OrdersResource(http);
    await r.list({ status: 'pending' });
    await r.get('o1');
    await r.submitTracking('o1', { trackingNumber: '1Z' });
    await r.refund('o1', { amount: 5 });
    await r.counts();
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/orders' });
    expect(calls[1]).toMatchObject({ method: 'GET', path: '/v1/orders/o1' });
    expect(calls[2]).toMatchObject({ method: 'POST', path: '/v1/orders/o1/tracking' });
    expect(calls[3]).toMatchObject({ method: 'POST', path: '/v1/orders/o1/refund' });
    expect(calls[4]).toMatchObject({ method: 'GET', path: '/v1/orders/counts' });
  });
});

describe('SalesResource', () => {
  it('list / bulkDelete', async () => {
    const { http, calls } = makeSpy();
    const r = new SalesResource(http);
    await r.list({});
    await r.bulkDelete(['s1', 's2']);
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/sales' });
    expect(calls[1]).toMatchObject({
      method: 'POST',
      path: '/v1/sales/bulk-delete',
      body: { ids: ['s1', 's2'] },
    });
  });
});

describe('ReturnsResource', () => {
  it('CRUD paths', async () => {
    const { http, calls } = makeSpy();
    const r = new ReturnsResource(http);
    await r.list({ status: 'open' });
    await r.get('r1');
    await r.create({ orderId: 'o1' });
    await r.update('r1', { status: 'resolved' });
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/returns' });
    expect(calls[1]).toMatchObject({ method: 'GET', path: '/v1/returns/r1' });
    expect(calls[2]).toMatchObject({ method: 'POST', path: '/v1/returns' });
    expect(calls[3]).toMatchObject({ method: 'PATCH', path: '/v1/returns/r1' });
  });
});

describe('CustomersResource', () => {
  it('list / get(handle) / bulkDelete / bulkExport', async () => {
    const { http, calls } = makeSpy();
    const r = new CustomersResource(http);
    await r.list({});
    await r.get('spooky/handle');
    await r.bulkDelete(['a', 'b']);
    await r.bulkExport(['a', 'b']);
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/customers' });
    // Handle must be url-encoded so slashes don't collide with route params.
    expect(calls[1]).toMatchObject({
      method: 'GET',
      path: '/v1/customers/spooky%2Fhandle',
    });
    expect(calls[2]).toMatchObject({
      method: 'POST',
      path: '/v1/customers/bulk-delete',
      body: { handles: ['a', 'b'] },
    });
    expect(calls[3]).toMatchObject({
      method: 'POST',
      path: '/v1/customers/bulk-export',
      body: { handles: ['a', 'b'] },
    });
  });
});

describe('ImportsResource', () => {
  it('list / get / start', async () => {
    const { http, calls } = makeSpy();
    const r = new ImportsResource(http);
    await r.list();
    await r.get('imp1');
    await r.start({ platform: 'ebay' as never });
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/imports' });
    expect(calls[1]).toMatchObject({ method: 'GET', path: '/v1/imports/imp1' });
    expect(calls[2]).toMatchObject({ method: 'POST', path: '/v1/imports' });
  });
});

describe('ActionLogResource', () => {
  it('list / facets / get / calls route shapes', async () => {
    const { http, calls } = makeSpy();
    const r = new ActionLogResource(http);
    await r.list({ platform: 'poshmark', status: 'failure', limit: 10 });
    await r.facets();
    await r.get('evt 1');
    await r.calls('evt 1');
    expect(calls[0]).toMatchObject({
      method: 'GET',
      path: '/v1/action-log',
      query: { platform: 'poshmark', status: 'failure', limit: 10 },
    });
    expect(calls[1]).toMatchObject({ method: 'GET', path: '/v1/action-log/facets' });
    expect(calls[2]).toMatchObject({ method: 'GET', path: '/v1/action-log/evt%201' });
    expect(calls[3]).toMatchObject({ method: 'GET', path: '/v1/action-log/evt%201/calls' });
  });
});

describe('PolicyPresetsResource', () => {
  it('list / create / update / delete route shapes', async () => {
    const { http, calls } = makeSpy();
    const r = new PolicyPresetsResource(http);
    await r.list({ kind: 'return' });
    await r.create({ kind: 'shipping', name: 'Free ship', policy: { free: true } }, { idempotencyKey: 'idem-1' });
    await r.update('pp 1', { name: 'renamed', isDefault: true });
    await r.delete('pp 1');
    expect(calls[0]).toMatchObject({
      method: 'GET',
      path: '/v1/policy-presets',
      query: { kind: 'return' },
    });
    expect(calls[1]).toMatchObject({
      method: 'POST',
      path: '/v1/policy-presets',
      body: { kind: 'shipping', name: 'Free ship', policy: { free: true } },
      idempotencyKey: 'idem-1',
    });
    // id must be url-encoded.
    expect(calls[2]).toMatchObject({
      method: 'PATCH',
      path: '/v1/policy-presets/pp%201',
      body: { name: 'renamed', isDefault: true },
    });
    expect(calls[3]).toMatchObject({ method: 'DELETE', path: '/v1/policy-presets/pp%201' });
  });
});

describe('AccountResource — imported from index re-export', () => {
  it('resource class is constructable with a spy', () => {
    const { http } = makeSpy();
    const r = new AccountResource(http);
    expect(r).toBeInstanceOf(AccountResource);
  });
});

describe('UnitsResource', () => {
  it('maps each method onto its v1 route, url-encoding ids', async () => {
    const { http, calls } = makeSpy();
    const r = new UnitsResource(http);
    await r.listForItem('item 1');
    await r.listForOrder('ord 1');
    await r.record('item 1', { value: 'SN-1234', namespace: 'serial' }, { idempotencyKey: 'idem-9' });
    await r.lookup({ value: 'SN-1234' });

    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/inventory/item%201/units' });
    expect(calls[1]).toMatchObject({ method: 'GET', path: '/v1/orders/ord%201/units' });
    expect(calls[2]).toMatchObject({
      method: 'POST',
      path: '/v1/inventory/item%201/units/identifiers',
      body: { value: 'SN-1234', namespace: 'serial' },
      idempotencyKey: 'idem-9',
    });
    expect(calls[3]).toMatchObject({
      method: 'POST',
      path: '/v1/inventory/units/lookup',
      body: { value: 'SN-1234' },
    });
  });
});
