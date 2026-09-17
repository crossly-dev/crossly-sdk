/**
 * CBX — cashback rails for a marketplace that sells physical goods.
 *
 * This is the surface a merchant integrates. It is deliberately small:
 * three calls get you from nothing to issuing cashback, and everything
 * else is reporting or the optional payout path.
 *
 * ```ts
 * const cbx = createCbxClient({ pat: process.env.CBX_API_KEY! });
 *
 * // once per user
 * const { data: subject } = await cbx.cbx.createSubject({ externalUserId: order.userId });
 *
 * // on every completed order — idempotent on YOUR id
 * await cbx.cbx.accrue({
 *   subjectId: subject.subjectId,
 *   cents: Math.floor(order.totalCents * 0.01),
 *   sourceExternalId: order.id,
 * });
 *
 * // on a refund, inside the maturation window
 * await cbx.cbx.reverseAccrual(accrualId, { reason: 'order refunded' });
 * ```
 *
 * ── TWO NUMBERS, NOT ONE ──────────────────────────────────────────────
 * A user's cashback lives in two states and they are genuinely different
 * things. `pendingCents` is earned but still inside its reversal window:
 * dollar-denominated, clawback-able, not yet tokens. `availableBaseUnits`
 * is CBX they hold. Pending stays in cents on purpose — promising a token
 * quantity up front and buying it weeks later would leave the reserve
 * short for the whole window.
 *
 * ── AMOUNTS ARE STRINGS ───────────────────────────────────────────────
 * Every token amount crosses the wire as a decimal string of base units,
 * because a balance can exceed what a JSON number holds exactly. Parse
 * them with `BigInt` and do not route them through `Number` on the way.
 */
import type { HttpClient, JsonObject } from './_shared.js';
import { CbxRewardsResource } from './cbx/rewards.js';
import { CbxStakingResource } from './cbx/staking.js';
import { CbxAdsResource } from './cbx/ads.js';
import { CbxCreditResource } from './cbx/credit.js';
import { CbxWalletPaymentsResource } from './cbx/wallet-payments.js';

/** Activity measures a campaign can gate or weight on. */
export type CbxActivityMetric =
  | 'accruals_count'
  | 'accrued_cents'
  | 'spend_count'
  | 'spend_base_units';

export interface CbxAccrueParams {
  subjectId: string;
  /** Positive whole cents. This is what the user earned. */
  cents: number;
  /**
   * Your own id for this accrual.
   *
   * Strongly recommended. It is what makes a retried webhook a no-op
   * instead of a second credit — without it, an at-least-once delivery
   * from your order pipeline becomes double cashback.
   */
  sourceExternalId?: string;
  /** Override your configured maturation window, in days. */
  maturationDays?: number;
}

export interface CbxCampaignParams {
  name: string;
  /** Base units, as a string. The hard ceiling on the distribution. */
  budgetBaseUnits: string;
  windowStart: string;
  windowEnd: string;
  eligibility?: { minMetric?: { metric: CbxActivityMetric; value: number } };
  weighting: {
    metric: CbxActivityMetric;
    mode?: 'proportional' | 'equal';
    /**
     * Cap one subject's weight before splitting.
     *
     * Worth setting on anything proportional: without it a single large
     * participant can take almost the whole pool, which makes the event
     * pointless for everyone else and is the obvious way to game a
     * volume-weighted split.
     */
    capPerSubject?: number;
  };
}

export class CbxResource {
  constructor(private http: HttpClient) {
    this.rewards = new CbxRewardsResource(http);
    this.staking = new CbxStakingResource(http);
    this.ads = new CbxAdsResource(http);
    this.credit = new CbxCreditResource(http);
    this.walletPayments = new CbxWalletPaymentsResource(http);
  }

  /** Which merchant this key belongs to, and the terms it issues on. */
  me() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/cbx/me' });
  }

  // ── Subjects + accruals ──────────────────────────────────────────

  /**
   * Map one of your user ids to a CBX subject. Idempotent.
   *
   * Your ids are opaque to us and unique only within your merchant, so
   * two marketplaces can both have a user "1".
   */
  createSubject(params: { externalUserId: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/subjects',
      body: params,
    });
  }

  /**
   * Record cashback a user earned.
   *
   * Returns `{ data: { duplicate: true } }` rather than an error when
   * `sourceExternalId` was already recorded, so a retry does not need
   * special-casing.
   */
  accrue(params: CbxAccrueParams) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/accruals',
      body: params,
    });
  }

  /**
   * Claw back a PENDING accrual — a refund, cancellation, or fraud.
   *
   * Fails with 409 once the accrual has converted, because by then the
   * value is tokens in somebody's balance and taking it back is a
   * different operation. This is why your maturation window must be at
   * least as long as your refund window.
   */
  reverseAccrual(accrualId: string, params: { reason: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cbx/accruals/${encodeURIComponent(accrualId)}/reverse`,
      body: params,
    });
  }

  // ── Spending (scope: spend) ──────────────────────────────────────

  /**
   * Redeem a user's CBX against an order.
   *
   * The user is debited exactly what they spend — the skim is never
   * added on top, because making CBX worth less when used than when sold
   * would invert the entire reason to spend rather than liquidate. The
   * skim comes out of YOUR fee on the order and is capped against it.
   *
   * Idempotent on `externalId`: a retried checkout returns the original
   * spend rather than debiting twice. Checkouts retry.
   *
   * Spending is always free and has no minimum. That asymmetry against
   * the withdrawal fee is the steer — the cheap path happens to be the
   * one you prefer, without ever telling anyone they cannot have their
   * money.
   */
  spend(params: {
    subjectId: string;
    baseUnits: string;
    /** Your fee on this order, in cents. The margin the skim comes from. */
    crosslyFeeCentsOnOrder: number;
    /** Your order id. Makes a retry a no-op. */
    externalId: string;
    centsPerToken?: number;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/spends',
      body: params,
    });
  }

  /**
   * Refund a spend.
   *
   * Returns the tokens AND claws the skim back out of both the community
   * pool and operator revenue — all three move together, because
   * returning the tokens while the others kept their shares would count
   * the same tokens twice against one reserve. The spend also stops
   * counting as campaign activity, so buy-then-refund cannot farm
   * distributions.
   */
  reverseSpend(externalId: string, params: { reason: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cbx/spends/${encodeURIComponent(externalId)}/reverse`,
      body: params,
    });
  }

  /** Total CBX a subject has spent in your marketplace. */
  spent(subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/cbx/subjects/${encodeURIComponent(subjectId)}/spent`,
    });
  }

  // ── Operator revenue ─────────────────────────────────────────────

  /**
   * Revenue accrued and not yet withdrawn, in CBX.
   *
   * Your share of the spend skim plus your half of withdrawal fees. It
   * sits inside the reserve until swept, which is why it is tracked
   * explicitly: without a number saying how much of the reserve is
   * yours, there is no safe amount to take out.
   */
  revenue() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/cbx/revenue' });
  }

  /**
   * Move accrued revenue to your revenue wallet.
   *
   * Moves at most what is genuinely free — reserve minus outstanding
   * balances, claims in flight, the pool, and unswept revenue. If the
   * reserve is short it moves NOTHING regardless of what is accrued: an
   * under-covered reserve is not a reason to stop paying users, it is a
   * reason to stop paying yourself. Pass `dryRun` for the arithmetic
   * without the transfer.
   */
  sweepRevenue(params?: { maxBaseUnits?: string; dryRun?: boolean }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/revenue/sweep',
      body: params ?? {},
    });
  }

  // ── Reading ──────────────────────────────────────────────────────

  /** Pending cents and available CBX for one subject. */
  balance(subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/cbx/subjects/${encodeURIComponent(subjectId)}/balance`,
    });
  }

  /** A subject's append-only CBX ledger, newest first. */
  ledger(subjectId: string, params?: { limit?: number }) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/cbx/subjects/${encodeURIComponent(subjectId)}/ledger`,
      query: params,
    });
  }

  /**
   * Your latest reserve reconciliation.
   *
   * `coverageBps` is your reserve against what you owe users, including
   * claims in flight. Below 100% your conversions stop — balances are
   * never credited against tokens that do not exist. Claims and spends
   * keep working, since those move value out and improve coverage.
   */
  treasury() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/cbx/treasury' });
  }

  /** Your events-pool balance. Sponsor budgets are tracked separately. */
  pool() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/cbx/pool' });
  }

  // ── Wallets + claims (scope: treasury) ───────────────────────────

  /**
   * Begin wallet verification. Present the returned `message` verbatim
   * for signing.
   *
   * A signature is required because there is no custody here: a payout
   * cannot be undone, so a typo or a swapped address is permanent. The
   * message binds your merchant, the subject, the address and a
   * single-use nonce, so the signature is not transferable.
   */
  walletChallenge(params: { subjectId: string; address: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/wallets/challenge',
      body: params,
    });
  }

  /** Complete verification with the user's signature over that message. */
  walletVerify(params: { subjectId: string; walletId: string; signature: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/wallets/verify',
      body: params,
    });
  }

  /** The verified payout address for a subject, or `null`. */
  wallet(subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/cbx/subjects/${encodeURIComponent(subjectId)}/wallet`,
    });
  }

  /**
   * What a claim would cost, without committing.
   *
   * Show this before asking a user to confirm. Every fee is at cost, and
   * the network fee includes the one-time account rent when the recipient
   * has no token account yet — that rent is a recoverable deposit on an
   * account the USER owns, not a fee anybody keeps.
   */
  quoteClaim(params: {
    subjectId: string;
    baseUnits: string;
    centsPerToken: number;
    networkCostCents?: number;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/claims/quote',
      body: params,
    });
  }

  /**
   * Reserve a claim. Debits the balance and queues the transfer.
   *
   * There is no destination parameter: payouts go to the address the
   * subject registered and proved they control. That is what keeps this a
   * payout to an account holder rather than a transfer service — and it
   * means a compromised key cannot redirect anybody's balance.
   */
  createClaim(params: {
    subjectId: string;
    baseUnits: string;
    centsPerToken: number;
    networkCostCents?: number;
    idempotencyKey: string;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/claims',
      body: params,
    });
  }

  /**
   * Send a reserved claim on chain.
   *
   * A status of `unconfirmed` means the transfer may have landed but
   * confirmation was not observed. Do NOT retry it — reconcile against
   * the chain first, or you risk paying twice.
   */
  sendClaim(claimId: string) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cbx/claims/${encodeURIComponent(claimId)}/send`,
    });
  }

  claim(claimId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/cbx/claims/${encodeURIComponent(claimId)}`,
    });
  }

  // ── Campaigns (scope: campaign) ──────────────────────────────────

  listCampaigns() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/cbx/campaigns' });
  }

  createCampaign(params: CbxCampaignParams) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/campaigns',
      body: params,
    });
  }

  /**
   * Compute the recipient list without paying it.
   *
   * Always do this first. An eligibility rule over a live dataset cannot
   * be sized by reading it — the only way to know whether it pays fifty
   * people or fifty thousand is to run it and look. Re-previewing
   * invalidates any prior approval by design.
   */
  previewCampaign(campaignId: string) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cbx/campaigns/${encodeURIComponent(campaignId)}/preview`,
    });
  }

  /** Approve the previewed list. */
  approveCampaign(campaignId: string) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cbx/campaigns/${encodeURIComponent(campaignId)}/approve`,
    });
  }

  /**
   * Pay an approved campaign.
   *
   * Refuses if the eligible set moved since approval — the hash would no
   * longer match, and an approval of a list that changed is not an
   * approval of what would now happen. `executionKey` makes a retry a
   * no-op rather than a second distribution.
   */
  executeCampaign(campaignId: string, params: { executionKey: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cbx/campaigns/${encodeURIComponent(campaignId)}/execute`,
      body: params,
    });
  }

  /** What a campaign paid, with the weight behind each amount. */
  campaignPayouts(campaignId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/cbx/campaigns/${encodeURIComponent(campaignId)}/payouts`,
    });
  }
  // ── Extended surfaces ────────────────────────────────────────────
  //
  // Nested rather than flattened onto this class, for one boring reason
  // and one real one. The boring one: the flat version pushed this file
  // past the repo's size cap. The real one: the methods above are the
  // surface the whitepaper and integration docs already describe, and
  // renaming them to match a new convention would churn a documented
  // contract for nothing.
  //
  // So the original surface stays flat and everything added since is
  // grouped. `client.cbx.accrue(...)` and
  // `client.cbx.rewards.createBoost(...)` both read fine; a hundred
  // flat methods would not.

  // Assigned in the constructor rather than as field initialisers:
  // under `useDefineForClassFields`, field initialisers run before the
  // parameter property `http` is assigned, so `this.http` would be
  // undefined here.

  /** Earn tiers, merchant-funded boosts, and rate quoting. */
  readonly rewards: CbxRewardsResource;

  /** Staking, and paying for services in CBX. */
  readonly staking: CbxStakingResource;

  /** Ad spend to CBX, CBX to ad credit, and threshold disbursements. */
  readonly ads: CbxAdsResource;

  /** The three balances, grants, and wholesale credit. */
  readonly credit: CbxCreditResource;

  /** Checkout paid from the buyer own wallet, signed by them. */
  readonly walletPayments: CbxWalletPaymentsResource;
}

export { CbxRewardsResource } from './cbx/rewards.js';
export { CbxStakingResource } from './cbx/staking.js';
export { CbxAdsResource } from './cbx/ads.js';
export { CbxCreditResource } from './cbx/credit.js';
export { CbxWalletPaymentsResource } from './cbx/wallet-payments.js';
