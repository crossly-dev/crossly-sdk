import type { HttpClient, JsonObject, PaginationParams, Platform, IdempotencyOpts } from './_shared.js';


export class InboxResource {
  constructor(private http: HttpClient) {}

  list(params: PaginationParams & { platform?: Platform; unread?: boolean } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/inbox', query: params });
  }
  get(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/inbox/${encodeURIComponent(id)}` });
  }
  reply(id: string, body: { message: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/inbox/${encodeURIComponent(id)}/reply`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  offer(
    id: string,
    body: { action: 'accept' | 'counter' | 'decline'; counterAmount?: number; note?: string },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/inbox/${encodeURIComponent(id)}/offer`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  // ─── Inbox sub-routes ──────────────────────────────────────────────────
  unreadCount() {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/inbox/conversations/unread-count',
    });
  }
  conversationMessages(conversationId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/inbox/conversations/${encodeURIComponent(conversationId)}/messages`,
    });
  }
  updateConversation(conversationId: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PATCH',
      path: `/v1/inbox/conversations/${encodeURIComponent(conversationId)}`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  offerAction(conversationId: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/inbox/conversations/${encodeURIComponent(conversationId)}/offer-action`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  cannedResponsesList() {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/inbox/canned-responses',
    });
  }
  cannedResponsesCreate(body: { name: string; body: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/inbox/canned-responses',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  cannedResponsesUpdate(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PUT',
      path: `/v1/inbox/canned-responses/${encodeURIComponent(id)}`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  cannedResponsesDelete(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/inbox/canned-responses/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  aiSuggest(body: { conversationId: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/inbox/ai-suggest',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  triageMessage(messageId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/inbox/messages/${encodeURIComponent(messageId)}/triage`,
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }

  // ─── Bulk conversation actions ──────────────────────────────────────────
  /** Body: `{ conversationIds: string[], action: 'mark_read'|'mark_unread'|'delete' }`.
   *  `delete` soft-hides — a new buyer message un-hides the thread automatically. */
  bulkAction(body: { conversationIds: string[]; action: 'mark_read' | 'mark_unread' | 'delete' }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/inbox/conversations/bulk',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Body: `{ conversationIds: string[], mode: 'draft'|'send' }`. `draft` writes
   *  a suggested reply into each thread; `send` also sends it immediately. */
  bulkAiRespond(body: { conversationIds: string[]; mode: 'draft' | 'send' }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/inbox/conversations/bulk-ai-respond',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Analytics ──────────────────────────────────────────────────────────────


export class NotificationsResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/notification-integrations' });
  }
  /** Body: `{ provider: 'slack'|'discord'|'webhook', name, config, enabled? }`. */
  create(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/notification-integrations',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  update(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PATCH',
      path: `/v1/notification-integrations/${encodeURIComponent(id)}`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  delete(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/notification-integrations/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Fire a canned test message to a notification destination. */
  test(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/notification-integrations/${encodeURIComponent(id)}/test`,
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Crossly Network (reciprocal engagement pool) ───────────────────────────


export class WebhooksResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/webhooks' });
  }
  create(body: { url: string; events: string[]; secret?: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/webhooks',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  delete(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/webhooks/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Fire a synthetic test.ping delivery to one registered webhook. */
  test(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/webhooks/${encodeURIComponent(id)}/test`,
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Templates ──────────────────────────────────────────────────────────────


export class NetworkResource {
  constructor(private http: HttpClient) {}

  /** The seller's pool membership row (null if not joined). */
  getPool() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/network/pool' });
  }
  joinPool(opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/network/pool',
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Update per-action toggles. Body: `{ shareEnabled?, followEnabled?, likeEnabled?, platforms? }`. */
  updatePool(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PATCH',
      path: '/v1/network/pool',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  leavePool(opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: '/v1/network/pool',
      idempotencyKey: opts.idempotencyKey,
    });
  }
  log(params: { limit?: number } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/network/pool/log',
      query: params,
    });
  }
  size() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/network/pool/size' });
  }
}

// ─── Taxonomy (per-platform category walks + required-field discovery) ─────

