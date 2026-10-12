import { describe, expect, it, vi } from 'vitest';
import {
  CrosslyAPIError,
  CrosslyConfigError,
  createClient,
} from '../index.js';

describe('createClient', () => {
  it('throws CrosslyConfigError when pat is missing the required prefix', () => {
    expect(() => createClient({ pat: 'not_a_real_pat' })).toThrow(CrosslyConfigError);
  });

  it('throws CrosslyConfigError when fetch is unavailable and not injected', () => {
    const realFetch = globalThis.fetch;
    // @ts-expect-error simulate older Node / Workers without global fetch
    delete globalThis.fetch;
    try {
      expect(() => createClient({ pat: 'crossly_pat_test' })).toThrow(CrosslyConfigError);
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  it('attaches every documented resource', () => {
    const client = createClient({ pat: 'crossly_pat_test', fetch: vi.fn() });
    const expected = [
      'inventory', 'listings', 'orders', 'sales', 'inbox', 'analytics',
      'accounts', 'automation', 'workflows', 'notifications', 'network',
      'taxonomy', 'webhooks', 'templates', 'imports', 'returns', 'customers',
      'reference', 'ai', 'tax', 'profile', 'connections', 'pat', 'magic',
      'compWatchlists', 'restockPrompts', 'savedViews', 'mobile', 'team',
      'account', 'sourcing', 'actionLog', 'policyPresets', 'raw',
    ] as const;
    for (const key of expected) expect(client).toHaveProperty(key);
  });
});

describe('HttpClient.request (via raw)', () => {
  it('sends Authorization, JSON body, and Idempotency-Key header', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = createClient({ pat: 'crossly_pat_xyz', fetch: fetchImpl });
    const out = await client.raw.request<{ ok: boolean }>({
      method: 'POST',
      path: '/v1/inventory',
      body: { sku: 'abc' },
      idempotencyKey: 'idem-1',
    });
    expect(out).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [, init] = fetchImpl.mock.calls[0]!;
    const headers = init!.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer crossly_pat_xyz');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Idempotency-Key']).toBe('idem-1');
    expect(init!.body).toBe(JSON.stringify({ sku: 'abc' }));
  });

  it('appends query params and skips empty values', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    const client = createClient({ pat: 'crossly_pat_xyz', fetch: fetchImpl });
    await client.raw.request({
      method: 'GET',
      path: '/v1/listings',
      query: { status: 'active', cursor: '', tags: ['a', 'b'] },
    });
    const url = fetchImpl.mock.calls[0]![0] as URL;
    expect(url.searchParams.get('status')).toBe('active');
    expect(url.searchParams.has('cursor')).toBe(false);
    expect(url.searchParams.getAll('tags')).toEqual(['a', 'b']);
  });

  it('returns undefined on 204 No Content', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    const client = createClient({ pat: 'crossly_pat_xyz', fetch: fetchImpl });
    const out = await client.raw.request({ method: 'DELETE', path: '/v1/x' });
    expect(out).toBeUndefined();
  });

  it('wraps server error envelope into CrosslyAPIError with stable code', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({ error: { code: 'rate_limited', message: 'slow down' } }),
        { status: 429, headers: { 'content-type': 'application/json' } },
      ),
    );
    const client = createClient({ pat: 'crossly_pat_xyz', fetch: fetchImpl });
    await expect(
      client.raw.request({ method: 'GET', path: '/v1/anything' }),
    ).rejects.toMatchObject({
      name: 'CrosslyAPIError',
      status: 429,
      code: 'rate_limited',
      message: 'slow down',
    });
  });

  it('synthesizes code http_<status> when server returns no envelope', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('Internal Server Error', { status: 500 }),
    );
    const client = createClient({ pat: 'crossly_pat_xyz', fetch: fetchImpl });
    await expect(
      client.raw.request({ method: 'GET', path: '/v1/anything' }),
    ).rejects.toMatchObject({ code: 'http_500', status: 500 });
  });
});

describe('CrosslyAPIError', () => {
  it('exposes status, code, details, and body for callers to branch on', () => {
    const err = new CrosslyAPIError(
      409,
      { code: 'conflict', message: 'taken', details: { field: 'sku' } },
      { error: { code: 'conflict' } },
    );
    expect(err.status).toBe(409);
    expect(err.code).toBe('conflict');
    expect(err.message).toBe('taken');
    expect(err.details).toEqual({ field: 'sku' });
    expect(err.body).toEqual({ error: { code: 'conflict' } });
  });
});
