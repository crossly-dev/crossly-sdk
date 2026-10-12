/**
 * HTTP client that backs every resource method.
 *
 * One instance per SDK client (set up via `createClient`). Owns the PAT,
 * the base URL, and a custom `fetch` implementation if the host passed one
 * (Node 18+ has global fetch; Cloudflare Workers / older Node need a polyfill).
 *
 * Mutation methods accept an optional `idempotencyKey` which is forwarded as
 * the `Idempotency-Key` header — the server caches the first response and
 * replays it for any retry within 24h. Pass one whenever a retry would be
 * unsafe (creating orders, charging cards, etc.).
 */
import { CrosslyAPIError, CrosslyConfigError, type CrosslyErrorPayload } from './errors.js';

/**
 * Token kinds the API accepts. A personal token and an OAuth-issued one are
 * verified through the same path server-side; only the prefix differs.
 */
export const TOKEN_PREFIXES = ['crossly_pat_', 'crossly_oat_', 'cbx_'] as const;

/**
 * `cbx_` is a third kind, and a different PRINCIPAL rather than a
 * different token for the same one.
 *
 * A `crossly_pat_`/`crossly_oat_` token acts as a Crossly seller. A `cbx_`
 * key acts as a MERCHANT on the CBX cashback rails — another marketplace
 * using Crossly as its loyalty backend, which has no Crossly seller
 * account at all. It reaches only `/v1/cbx/*`; every other route rejects
 * it server-side. Use `createCbxClient` rather than `createClient` so the
 * resource surface matches what the key can actually do.
 */
export const CBX_TOKEN_PREFIX = 'cbx_';

export interface ClientConfig {
  /**
   * A Crossly API token.
   *
   * Two kinds are valid and the API treats them identically:
   *   `crossly_pat_…`  a Personal Access Token, minted in Settings
   *   `crossly_oat_…`  issued by the OAuth provider to an authorized app
   *
   * The field is still named `pat` for compatibility with callers written
   * before OAuth tokens existed.
   */
  pat: string;
  /** Override the API base — default: https://crossly.net/api */
  baseUrl?: string;
  /** Inject a fetch impl. Useful for testing, Cloudflare Workers, or older Node. */
  fetch?: typeof fetch;
  /** Default request timeout in ms. Default 30_000. */
  timeoutMs?: number;
  /** Custom User-Agent appended after the SDK identifier. */
  userAgent?: string;
}

/** Query parameter map — any plain object with string-keyed primitives or arrays. */
export type QueryParams = object;

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  query?: QueryParams;
  body?: unknown;
  idempotencyKey?: string;
  /** Per-request timeout override. */
  timeoutMs?: number;
  /** Per-request signal for cancellation. Composed with the timeout signal. */
  signal?: AbortSignal;
}

const DEFAULT_BASE_URL = 'https://crossly.net/api';
const SDK_VERSION = '0.1.0';

export class HttpClient {
  private readonly pat: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultTimeoutMs: number;
  private readonly userAgent: string;

  constructor(config: ClientConfig) {
    // Both token kinds, because the API accepts both.
    //
    // This used to demand `crossly_pat_`, which meant an OAuth-issued
    // `crossly_oat_` token — the kind `crossly login` obtains, and one the API
    // verifies through the same path with an extra grant check — was refused
    // here before a request was ever made. The rejection came from the client,
    // so it looked like a bad token rather than a client that would not carry
    // it.
    if (!config.pat || !TOKEN_PREFIXES.some((p) => config.pat.startsWith(p))) {
      throw new CrosslyConfigError(
        'A token starting with "crossly_pat_" or "crossly_oat_" is required. ' +
          'Mint a personal token at https://crossly.net/settings under Personal ' +
          'Access Tokens, or run `crossly login` to authorize via OAuth.',
      );
    }
    this.pat = config.pat;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.fetchImpl = config.fetch ?? globalThis.fetch;
    if (!this.fetchImpl) {
      throw new CrosslyConfigError(
        'No global fetch found. Pass a `fetch` impl in createClient({ fetch }), or run on Node 18+.',
      );
    }
    this.defaultTimeoutMs = config.timeoutMs ?? 30_000;
    this.userAgent = `crossly-sdk/${SDK_VERSION}${config.userAgent ? ` ${config.userAgent}` : ''}`;
  }

  async request<T>(opts: RequestOptions): Promise<T> {
    const url = new URL(this.baseUrl + opts.path);
    if (opts.query) {
      for (const [k, v] of Object.entries(opts.query as Record<string, unknown>)) {
        if (v === undefined || v === null || v === '') continue;
        if (Array.isArray(v)) {
          for (const item of v) url.searchParams.append(k, String(item));
        } else {
          url.searchParams.set(k, String(v));
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.pat}`,
      Accept: 'application/json',
      'User-Agent': this.userAgent,
    };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

    // Compose timeout + user signal.
    const ctrl = new AbortController();
    const timeoutMs = opts.timeoutMs ?? this.defaultTimeoutMs;
    const timer = setTimeout(() => ctrl.abort(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
    if (opts.signal) {
      if (opts.signal.aborted) ctrl.abort(opts.signal.reason);
      else opts.signal.addEventListener('abort', () => ctrl.abort(opts.signal!.reason), { once: true });
    }

    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        method: opts.method,
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    // 204 / empty.
    if (res.status === 204) return undefined as T;

    const text = await res.text();
    let parsed: unknown = undefined;
    if (text.length > 0) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!res.ok) {
      const envelope = parsed && typeof parsed === 'object'
        ? (parsed as { error?: Partial<CrosslyErrorPayload> }).error
        : undefined;
      throw new CrosslyAPIError(
        res.status,
        {
          code: envelope?.code ?? `http_${res.status}`,
          message: envelope?.message ?? res.statusText ?? 'Request failed',
          details: envelope?.details,
        },
        parsed,
      );
    }

    return parsed as T;
  }
}
