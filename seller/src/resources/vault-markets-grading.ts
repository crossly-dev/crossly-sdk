import type { HttpClient, IdempotencyOpts, JsonObject } from './_shared.js';

// ─── Vault Markets grading: grade a vault unit without taking it out ────────
//
// `client.vaultMarkets.grading`. A raw unit on the grading hub's shelf goes
// into a Grading Run and comes back to the same vault item with its grade.
// The slot is free; your saved card is charged only if the run locks. Money
// is integer CENTS of US dollars.

/** If the run misses its minimum: `roll_over` into the next open run at the tier (default), or `release`. */
export type VaultGradingMissMode = 'roll_over' | 'release';

export interface SendVaultUnitToGradingBody {
  vaultItemId: string;
  /** The Grading Run to join. */
  runId: string;
  /** What it is worth, in cents (the grader's tier limit and insurance); default the mark. */
  declaredValueCents?: number;
  /** A person checks centering and surface first, for a fee. */
  prescreen?: boolean;
  missMode?: VaultGradingMissMode;
}

export class VaultMarketsGradingResource {
  constructor(private http: HttpClient) {}

  /** Your vault units sent to grading: where each is in its run, and the grade once back. */
  list() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/grading' });
  }

  /** Send a raw vault unit on the grading hub's shelf to a Grading Run; it is held until it comes back graded. */
  send(body: SendVaultUnitToGradingBody, opts: IdempotencyOpts = {}) {
    return this.http.request<{ submissionId: string; vaultItemId: string; status: 'grading' }>({ method: 'POST', path: '/v1/vault-markets/grading', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Pull a unit out of its run before the run locks (nothing charged); it goes back on the shelf. */
  pull(submissionId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ status: 'stored' }>({ method: 'POST', path: `/v1/vault-markets/grading/${encodeURIComponent(submissionId)}/pull`, idempotencyKey: opts.idempotencyKey });
  }
}
