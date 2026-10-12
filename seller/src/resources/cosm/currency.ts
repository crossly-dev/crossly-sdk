/**
 * The token itself: balances, supply, the emission taper, the sinks that
 * destroy it, and the commitments that let somebody check the arithmetic
 * without trusting us.
 *
 * One link in the `CosmResource` chain — see `./base.js`. Every method here
 * is reached as `client.cosm.<name>()`.
 */
import type { JsonObject } from '../_shared.js';
import { CosmBase } from './base.js';

export class CosmCurrencyMethods extends CosmBase {
  /**
   * A subject's balance, and the emission taper currently in force.
   *
   * `taper.rateMultiplierBps` is 10000 at the full rate and steps down
   * as lifetime supply grows. It depends on total supply rather than on
   * anything about this subject, so two sellers earning in the same week
   * always see the same figure.
   */
  balance(subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/balance',
      query: { subjectId },
    });
  }

  /**
   * Total supply — minted, burned, reversed, circulating.
   *
   * The one question a holder of an emitted currency cannot answer for
   * themselves. Every figure is derived from the ledger rather than a
   * cached counter, so it cannot drift from the rows it summarises.
   *
   * `reconciles` is the check you can run against us: minted minus
   * burned minus reversed must equal the sum of every balance, and the
   * auction debit/credit pair must cancel exactly. False means a bug on
   * our side, not stale data — treat it as an incident.
   */
  supply() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/cosm/supply' });
  }

  /**
   * Per-epoch emission against the backstop ceiling.
   *
   * `demanded` is what activity would have earned at full rate;
   * `emitted` is what was credited. Both are reported because only the
   * second would make a refusal indistinguishable from a quiet rate cut.
   *
   * `ceilingBound` should be rare. The real governor is the emission
   * rate, which is a share of transaction value — so the ceiling binding
   * signals an anomaly rather than a busy week.
   */
  epochs(limit?: number) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/supply/epochs',
      query: limit === undefined ? undefined : { limit: String(limit) },
    });
  }

  /**
   * The published emission taper. Fixed years ahead.
   *
   * Indexed on CUMULATIVE MINTED, which is monotonic and which nothing
   * anybody does can move backwards. Circulating supply would be
   * self-correcting against a healthy sink and would also be reflexive —
   * burning to hold the taper back would become a strategy.
   *
   * The final step is a floor rather than zero: a schedule that
   * terminates is a loyalty programme with an expiry date, where the
   * last cohort to join earns nothing.
   */
  schedule() {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/supply/schedule',
    });
  }

  /**
   * Community burn goal progress.
   *
   * Aggregate burn crossing a threshold unlocks a cosmetic for everyone
   * who contributed — scoped to contributors, because a goal rewarding
   * non-participants makes contributing irrational.
   *
   * `progressBps` is capped at 10000: the total is snapshotted on
   * completion so a bar never reads over 100%.
   */
  goals() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/cosm/goals' });
  }

  /**
   * What one shop-employee conversation will cost, in COSM.
   *
   * Priced with the same functions the charge uses, so the figure shown
   * is the figure taken. Half burns and half moves to the market pool;
   * the two always sum to the total exactly. Charges nothing and reads
   * nothing — safe to call on every keystroke.
   */
  employeeFeeQuote(params: { totalCents: number }) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/employee/fee-quote',
      query: params,
    });
  }

  /**
   * Withdrawal history, and whether withdrawals are open at all.
   *
   * `meta.open` is false today and `meta.outstanding` lists what is
   * still to be met: an audited minter, a securities opinion, a
   * money-transmission review, and the emission invariant proven under
   * real volume.
   *
   * Read this before showing a withdraw button. Showing one that 409s is
   * worse than showing none.
   */
  withdrawals(subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/withdrawals',
      query: { subjectId },
    });
  }

  /**
   * Request a withdrawal to the subject's own proven wallet.
   *
   * REFUSES with 409 until COSM is transferable — check
   * `withdrawals().meta.open` first.
   *
   * THERE IS NO DESTINATION PARAMETER, deliberately. It resolves to the
   * subject's own VERIFIED connected wallet, because a per-request
   * destination is how a compromised session drains a balance to
   * somebody else's address.
   *
   * Idempotent on `externalId` — pass a stable id so a retried request
   * returns the original withdrawal rather than making a second one.
   */
  requestWithdrawal(input: { subjectId: string; baseUnits: string; externalId: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cosm/withdrawals',
      body: input,
    });
  }

  /**
   * Published Merkle commitments.
   *
   * `cosm_emission` commits an epoch's activity claims; `cbx_liability`
   * commits every balance. Together they turn "emission is
   * activity-backed" and "liability is what we say" from claims into
   * checks.
   *
   * READ `anchoredAt` BEFORE RELYING ON A ROOT. Null means computed and
   * stored but not on chain — a row the operator could edit, which
   * proves nothing to somebody who does not already trust them.
   */
  attestations(filters?: { kind?: 'cosm_emission' | 'cbx_liability'; limit?: number }) {
    const query: Record<string, string> = {};
    if (filters?.kind) query.kind = filters.kind;
    if (filters?.limit !== undefined) query.limit = String(filters.limit);
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/attestations',
      query: Object.keys(query).length ? query : undefined,
    });
  }

  /**
   * A Merkle inclusion proof for one subject against a published root.
   *
   * VERIFY IT LOCALLY rather than trusting the `verified` field — a
   * verifier that needs the server is not a verifier. Hash the leaf with
   * a 0x00 prefix, fold each step with 0x01, order the pair
   * lexicographically at every step, compare to the root.
   *
   * The prefixes matter: without domain separation an internal node is
   * indistinguishable from a leaf and membership of uncommitted data can
   * be forged.
   */
  attestationProof(commitmentId: string, subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/cosm/attestations/${encodeURIComponent(commitmentId)}/proof`,
      query: { subjectId },
    });
  }

  /**
   * Record the chain signature for a commitment anchored BY HAND.
   *
   * An ops path, not a trust boundary. It writes a signature somebody
   * else produced and does NOT verify that the signature anchors this
   * root. A wrong value here produces a commitment that looks anchored
   * and is not — strictly worse than `anchoredAt: null`, which at least
   * tells the truth. Confirm the transaction on chain first.
   */
  recordManualAnchor(commitmentId: string, params: { chainSignature: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cosm/attestations/${encodeURIComponent(commitmentId)}/anchor`,
      body: params,
    });
  }
}
