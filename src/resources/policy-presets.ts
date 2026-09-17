import type { HttpClient, JsonObject, IdempotencyOpts } from './_shared.js';

export type PolicyPresetKind = 'return' | 'shipping' | 'payment';

export interface PolicyPreset {
  id: string;
  userId: string;
  kind: PolicyPresetKind;
  name: string;
  isDefault: boolean;
  /** Opaque policy payload — the shape depends on `kind` and is the server's source of truth. */
  policy: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyPresetCreate {
  kind: PolicyPresetKind;
  name: string;
  policy: Record<string, unknown>;
  isDefault?: boolean;
}

export interface PolicyPresetUpdate {
  name?: string;
  policy?: Record<string, unknown>;
  isDefault?: boolean;
}

// ─── Policy presets (reusable return/shipping/payment policies) ─────────────


export class PolicyPresetsResource {
  constructor(private http: HttpClient) {}

  /** List policy presets, optionally filtered by `kind`. Envelope: `{ data }` — the canonical /v1 collection shape. */
  list(params: { kind?: PolicyPresetKind } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/policy-presets',
      query: params,
    });
  }
  create(body: PolicyPresetCreate, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/policy-presets',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  update(id: string, body: PolicyPresetUpdate, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PATCH',
      path: `/v1/policy-presets/${encodeURIComponent(id)}`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  delete(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/policy-presets/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}
