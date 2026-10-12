/**
 * The ad product in both directions, plus threshold disbursements.
 *
 * Advertising is payable in CBX and nothing else, so `purchaseAdCredit`
 * is the only way in. Disbursement rules live here because what they
 * distribute is the pool that ad spend funds.
 *
 * Reached as `client.cbx.ads.*`.
 */
import type { HttpClient, JsonObject } from '../_shared.js';
import type { CbxActivityMetric } from '../cbx.js';

export class CbxAdsResource {
  constructor(private http: HttpClient) {}

  // ── CBX → ad credit ──────────────────────────────────────────────

  /**
   * Your unspent advertising credit, in cents.
   *
   * Credit is denominated in dollars, priced when your payment
   * finalized — deliberately not held as a token quantity, since a price
   * move would otherwise silently change the budget you prepaid.
   *
   * Spendable on advertising only, and not refundable to dollars or
   * tokens. That is what makes the purchase discount possible.
   */
  adCredit() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/cbx/ad-credit' });
  }

  /**
   * What a given number of tokens buys in ad credit.
   *
   * The discount grosses the credit UP rather than marking your tokens
   * up: `marketValueCents` is what they are worth, `creditCents` is
   * what they buy.
   */
  quoteAdCredit(params: { baseUnits: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/ad-credit/quote',
      body: params,
    });
  }

  /**
   * Claim ad credit against a CBX transfer you sent.
   *
   * Send CBX to our revenue wallet, then present the signature. We read
   * the actual balance delta at FINALIZED commitment — a confirmed
   * transaction can still be dropped by a fork, and this grants real
   * credit.
   *
   * Priced at the spot when the claim is processed, not when you signed:
   * pricing at send time would let somebody hold signed transfers and
   * claim only the ones that moved in their favour.
   *
   * A 409 means it has not finalized yet and you should retry. A 400
   * means it will never be claimable.
   */
  purchaseAdCredit(params: { txSig: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/ad-credit/purchase',
      body: params,
    });
  }

  /**
   * Consume ad credit for a billing period.
   *
   * Spends what the balance covers and reports the rest as
   * `shortfallCents` for you to bill in dollars. Idempotent on
   * `externalId`.
   */
  spendAdCredit(params: { cents: number; externalId: string; memo?: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/ad-credit/spend',
      body: params,
    });
  }

  /** Ad-credit movements, newest first. Append-only, with no refund kind. */
  adCreditLedger() {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cbx/ad-credit/ledger',
    });
  }

  // ── Threshold disbursements ──────────────────────────────────────

  /** Threshold rules that fire community distributions. */
  disbursementRules() {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cbx/disbursement-rules',
    });
  }

  /**
   * Fire a distribution when the events pool crosses a threshold.
   *
   * Applies to the EVENTS POOL only, never free reserve surplus —
   * reserve surplus funds the next accrual without touching the market,
   * so distributing it would force us to buy the same tokens back at
   * spread plus MEV.
   *
   * `checkCadenceHours` bounds how often it can fire even when the
   * pool is over the line: a pure threshold fires at an unpredictable
   * moment, and the pool jumps most right after a lapse sweep —
   * precisely when engagement was worst.
   *
   * The rule decides WHEN only. Firing opens a campaign that still needs
   * preview, approval and execution.
   */
  createDisbursementRule(params: {
    name: string;
    thresholdBaseUnits: string;
    distributeBps?: number;
    checkCadenceHours?: number;
    requireCoverageBps?: number;
    metric?: CbxActivityMetric;
    lookbackDays?: number;
    maxRecipients?: number;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/disbursement-rules',
      body: params,
    });
  }

  /**
   * Evaluate a rule now, firing it if every gate passes.
   *
   * Gates in order: cadence, threshold, coverage. `outcome` names the
   * one that stopped it. A missing or stale treasury snapshot declines
   * on `coverage` — unknown coverage is not healthy coverage.
   */
  checkDisbursementRule(ruleId: string, params?: { dryRun?: boolean }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cbx/disbursement-rules/${encodeURIComponent(ruleId)}/check`,
      body: params ?? {},
    });
  }

  /** Enable or disable a disbursement rule. */
  setDisbursementRuleActive(ruleId: string, params: { isActive: boolean }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cbx/disbursement-rules/${encodeURIComponent(ruleId)}/active`,
      body: params,
    });
  }

  /**
   * How close each rule is to firing — safe to show users.
   *
   * A climbing counter toward a known number is the reason to prefer
   * cadence-plus-threshold over a pure threshold: people can see the
   * pool rising and know roughly when the next event is possible.
   */
  disbursementProgress() {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cbx/disbursement-progress',
    });
  }
}
