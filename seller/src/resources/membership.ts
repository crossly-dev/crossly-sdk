import type { HttpClient, JsonObject } from './_shared.js';

/**
 * Crossly One — the caller's platform-wide buyer membership.
 *
 * Read-only over the API: subscribing/cancelling is a Stripe Checkout flow that
 * belongs in a browser, not a headless token client.
 */
export class MembershipResource {
  constructor(private http: HttpClient) {}

  /** The caller's membership status + concrete benefit values (null tier if none). */
  get() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/membership' });
  }
}
