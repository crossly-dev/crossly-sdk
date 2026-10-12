/**
 * The three balances, grants, and wholesale credit.
 *
 * Reached as `client.cbx.credit.*`.
 */
import type { HttpClient, JsonObject } from '../_shared.js';

export class CbxCreditResource {
  constructor(private http: HttpClient) {}

  // ── Balances ─────────────────────────────────────────────────────

  /**
   * All three balances a subject holds.
   *
   * EARNED is cashback and affiliate accruals — withdrawable once
   * matured and above the claim floor. GRANTED is ad credit, wholesale
   * draws and promos — spendable in your marketplace only and never
   * withdrawable, so it creates no sell pressure. CONNECTED is the
   * subject's own self-custodied CBX, reachable through a bounded
   * delegation; it was never our liability.
   *
   * `connectedAvailableBaseUnits` is delegation HEADROOM, not a wallet
   * balance. The subject may hold less than they approved, or have
   * revoked on chain without telling us, so treat it as a ceiling and
   * let the spend re-read the chain. Treating it as cash on hand is how
   * a checkout promises a payment it cannot make.
   */
  balances(subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/cbx/subjects/${encodeURIComponent(subjectId)}/balances`,
    });
  }

  /**
   * Which balances would pay for a spend, and in what order.
   *
   * The order is granted → earned → connected and you do not choose it.
   * Granted first is a security property: if earned spent first, a
   * subject holding both would spend their withdrawable balance down
   * while their non-withdrawable grant sat untouched — converting a
   * grant into a withdrawable balance one purchase at a time.
   *
   * Returns `shortfallBaseUnits` rather than failing, so a checkout can
   * charge the remainder to a card. Pass `excludeConnected` on a flow
   * that cannot wait for an on-chain transfer.
   */
  spendPlan(
    subjectId: string,
    params: { baseUnits: string; excludeConnected?: boolean },
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cbx/subjects/${encodeURIComponent(subjectId)}/spend-plan`,
      body: params,
    });
  }

  // ── Grants ───────────────────────────────────────────────────────

  /**
   * Live grants, soonest-expiring first.
   *
   * That ordering is the allocation order: a spend consumes the grant
   * closest to lapsing, so value about to expire is used before value
   * that will not.
   */
  grants(subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/cbx/subjects/${encodeURIComponent(subjectId)}/grants`,
    });
  }

  /**
   * Issue grant credit — in-platform, non-withdrawable.
   *
   * Requires a funding `batchId` for every kind except
   * `grant_makegood`. Grant credit is spendable at merchants who receive
   * real value, so the tokens have to exist — the same rule earned
   * balance obeys. A makegood is exempt because compensating somebody
   * for our failure must not be blocked on treasury state.
   */
  createGrant(
    subjectId: string,
    params: {
      baseUnits: string;
      kind: 'grant_ad_credit' | 'grant_wholesale_credit' | 'grant_promo' | 'grant_makegood';
      expiresAt?: string;
      batchId?: string;
      externalId?: string;
      memo?: string;
    },
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cbx/subjects/${encodeURIComponent(subjectId)}/grants`,
      body: params,
    });
  }

  // ── Wholesale credit ─────────────────────────────────────────────

  /**
   * A seller's wholesale credit line.
   *
   * Trade credit, not token-collateralized lending. Secured by
   * receivables we already hold — the payout stream sits under a hold
   * with an exposure ceiling — and secondarily by goods bought from our
   * own wholesale channel. CBX is the alignment mechanism, not the
   * collateral: a stake raises the limit and lowers the rate, bounded to
   * a share of the earned limit so a price collapse can never remove the
   * majority of a facility.
   *
   * The limit may FALL. A drawn balance is never accelerated or
   * margin-called — there is no liquidation engine, no keeper and no
   * oracle trigger anywhere in it.
   */
  line(params: { sellerUserId: string }) {
    const q = new URLSearchParams({ sellerUserId: params.sellerUserId });
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/cbx/credit?${q.toString()}`,
    });
  }

  /**
   * Recompute a limit from trading history and stake.
   *
   * The earned limit is a share of trailing SETTLED payout volume —
   * money that actually reached the seller, not listed inventory or
   * projected sales. The stake bonus is capped at a share of that, so a
   * seller with no history gets nothing however much they stake.
   *
   * A frozen line stays frozen: freezing is a credit decision somebody
   * made, and a recompute must not quietly undo it.
   */
  refreshLine(params: { sellerUserId: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/credit/refresh',
      body: params,
    });
  }

  /**
   * Draw against a line, receiving grant credit.
   *
   * The advance lands as GRANT balance: in-platform only, so it cannot
   * be withdrawn, cannot be turned into cash and absconded with, and
   * adds nothing to the float that could hit an order book.
   *
   * Restricted to wholesale channels — the limit was sized on the theory
   * that the advance buys goods that get sold and generate the payout
   * stream repaying it, and credit spent on a subscription does not
   * create that stream.
   *
   * Refuses if the reserve has no unallocated tokens: credit is real
   * value and cannot be advanced against tokens that do not exist.
   * Idempotent on `externalId`.
   */
  draw(params: {
    sellerUserId: string;
    cents: number;
    channel: 'wholesale_lot' | 'supplier_order' | 'bulk_purchase';
    externalId: string;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/credit/draw',
      body: params,
    });
  }

  /**
   * Apply a repayment to a line.
   *
   * Needs `treasury` scope, which looks backwards next to a draw needing
   * only `spend` and is deliberate: a forged repayment writes off real
   * money owed to us, while a forged draw hands out credit spendable
   * only inside the marketplace. The scope follows the loss.
   *
   * Clamped to what is outstanding — a payout larger than the debt would
   * otherwise push the balance negative and read as credit nobody
   * underwrote.
   */
  repay(params: {
    sellerUserId: string;
    cents: number;
    kind: 'repay_payout' | 'repay_invoice';
    externalId: string;
    purchaseId?: string;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/credit/repay',
      body: params,
    });
  }

  /**
   * Stop new draws. Leaves the drawn balance on its terms.
   *
   * The only lever over a line, and deliberately the only one. A seller
   * who took inventory on Tuesday keeps Tuesday's terms whatever the
   * token does on Wednesday — the only way a credit product sits next to
   * a volatile asset without transmitting its volatility.
   */
  freezeLine(params: { sellerUserId: string; reason: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/credit/freeze',
      body: params,
    });
  }
}
