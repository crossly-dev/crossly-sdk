/**
 * Staking and service redemptions — the lock and the sinks.
 *
 * Reached as `client.cbx.staking.*`.
 */
import type { HttpClient, JsonObject } from '../_shared.js';

export class CbxStakingResource {
  constructor(private http: HttpClient) {}

  // ── Staking ──────────────────────────────────────────────────────

  /**
   * Staking tiers — what locking tokens buys.
   *
   * Staking pays NOTHING. It confers a lower withdrawal fee and a higher
   * earn rate on future purchases: a discount for commitment, not a
   * return on a holding. Staked tokens stay in the user's balance and
   * stay backed by the reserve; they simply become unspendable.
   */
  stakeTiers() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/cbx/stake-tiers' });
  }

  /** Define a staking tier. Upserts on `slug`. */
  createStakeTier(params: {
    slug: string;
    label: string;
    minBaseUnits: string;
    feeDiscountBps?: number;
    earnBoostBps?: number;
    cooldownDays?: number;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/stake-tiers',
      body: params,
    });
  }

  /**
   * A subject's staking state and SPENDABLE balance.
   *
   * `availableBaseUnits` is the number your checkout must use —
   * balance minus anything locked. Reading `balance()` instead would
   * let a user spend staked tokens.
   */
  stake(subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/cbx/subjects/${encodeURIComponent(subjectId)}/stake`,
    });
  }

  /**
   * Lock a subject's tokens for a tier.
   *
   * Refuses an amount that clears no tier — locking tokens for no
   * benefit is never what somebody meant to do. One stake per subject.
   */
  createStake(subjectId: string, params: { baseUnits: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cbx/subjects/${encodeURIComponent(subjectId)}/stake`,
      body: params,
    });
  }

  /**
   * Start the unstake cooldown.
   *
   * The earn boost ends immediately; the tokens unlock at
   * `unlocksAt`. The fee discount survives the wait, since withdrawing
   * is what somebody in cooldown is trying to do.
   */
  unstake(subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cbx/subjects/${encodeURIComponent(subjectId)}/stake/unstake`,
    });
  }

  // ── Service redemptions ──────────────────────────────────────────

  /** Services payable in CBX, and the discount each carries. */
  redeemableServices() {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cbx/redemptions/services',
    });
  }

  /**
   * What a service costs in tokens right now.
   *
   * Fails with 409 when there is no fresh price: a dollar-priced service
   * has no honest token quantity without a spot, and a guess either
   * overcharges the user or undercharges us.
   */
  quoteRedemption(params: { serviceKind: string; listPriceCents: number }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/redemptions/quote',
      body: params,
    });
  }

  /**
   * Pay for a service in CBX.
   *
   * Idempotent on (`serviceKind`, `externalId`) rather than
   * `externalId` alone — a grading submission and a listing boost can
   * share an id because they refer to the same item.
   *
   * Staked tokens cannot pay: the debit checks spendable balance.
   */
  redeem(params: {
    subjectId: string;
    serviceKind: string;
    listPriceCents: number;
    externalId: string;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/redemptions',
      body: params,
    });
  }
}
