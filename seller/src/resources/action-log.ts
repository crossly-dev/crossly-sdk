import type { HttpClient, JsonObject } from './_shared.js';

/** Filters for `actionLog.list`. Mirror the v1 `/action-log` querystring. */
export interface ActionLogListParams {
  platform?: string;
  action?: string;
  category?: string;
  status?: string;
  source?: string;
  targetType?: string;
  targetId?: string;
  /** ISO lower bound (inclusive) on created_at. */
  since?: string;
  /** ISO upper bound (exclusive) on created_at. */
  until?: string;
  limit?: number;
  offset?: number;
}

/**
 * Action log — the durable, queryable record of every action across
 * marketplaces. Answers "what happened / what was sent / what went wrong".
 * Read-only. Requires the `activity:read` scope on the PAT.
 */
export class ActionLogResource {
  constructor(private http: HttpClient) {}

  /** List semantic events ("what happened"), newest first. Filterable. */
  list(params: ActionLogListParams = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/action-log',
      query: params,
    });
  }
  /** Distinct platforms/actions/categories present (last 90 days) — for filter UIs. */
  facets() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/action-log/facets' });
  }
  /** One event by id (ownership-checked). */
  get(id: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/action-log/${encodeURIComponent(id)}`,
    });
  }
  /** The outbound wire calls under an event ("what was sent / what went wrong"). */
  calls(id: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/action-log/${encodeURIComponent(id)}/calls`,
    });
  }
}
