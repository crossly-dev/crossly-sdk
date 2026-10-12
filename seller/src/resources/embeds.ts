import type { HttpClient, JsonObject, IdempotencyOpts } from './_shared.js';

/**
 * Publishable keys — the credential behind an embedded storefront.
 *
 * ── The distinction that matters ─────────────────────────────────────
 *
 * A publishable key is the thing being MANAGED here, never the thing doing the
 * authenticating: these calls need a normal PAT, exactly like every other v1
 * resource. The key itself is a separate, weaker principal that only the embed
 * script uses, from a browser, on an allow-listed origin.
 *
 * Which is also why `key` comes back in full on every read rather than being
 * masked the way a PAT is. It is pasted into public HTML — hiding it in the
 * owner's own dashboard would be theatre that costs a re-mint every time they
 * lose the tab.
 */
export interface PublishableKey {
  id: string;
  /** Returned in full — see above. */
  key: string;
  name: string;
  /** Origins the key may be used from. Empty means the key is unusable. */
  allowedOrigins: string[];
  environment: 'live' | 'test';
  lastUsedAt: string | null;
  createdAt: string;
}

export class EmbedsResource {
  constructor(private http: HttpClient) {}

  /** Your live (non-revoked) publishable keys. Requires `accounts:read`. */
  listKeys() {
    return this.http.request<{ data: PublishableKey[] }>({
      method: 'GET',
      path: '/v1/embeds/keys',
    });
  }

  /**
   * Mint a key. Requires `accounts:write`.
   *
   * `allowedOrigins` is the whole security boundary — a key with no origins
   * cannot be used, and a key with the wrong ones is a key someone else's site
   * can spend your catalogue through. Pass exact origins (`https://shop.example.com`),
   * not paths.
   */
  createKey(body: {
    name: string;
    allowedOrigins?: string[];
    environment?: 'live' | 'test';
  }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/embeds/keys',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  /**
   * Revoke a key. Requires `accounts:write`.
   *
   * Immediate and irreversible: any page still serving the old key stops
   * working the moment this returns, so mint and swap the replacement first.
   */
  revokeKey(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/embeds/keys/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}
