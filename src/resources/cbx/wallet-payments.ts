/**
 * Checkout paid from the buyer's own wallet.
 *
 * Reached as `client.cbx.walletPayments.*`.
 *
 * ── THE FLOW ─────────────────────────────────────────────────────────
 *   1. `quote()`    — we build an unsigned transfer
 *   2. your client  — the buyer's wallet signs and submits it
 *   3. `confirm()`  — you hand us the signature; we read the chain,
 *                     screen the payer, and tell you whether to ship
 *
 * The middle step happens where we cannot see it, which is the point:
 * we never hold a key or a delegation and never submit anything, so the
 * platform has no authority over the buyer's tokens at any moment.
 */
import type { HttpClient, JsonObject } from '../_shared.js';

export class CbxWalletPaymentsResource {
  constructor(private http: HttpClient) {}

  /**
   * Build a transfer for the buyer to sign themselves.
   *
   * RESERVES NOTHING — no row, no hold, no balance change. The buyer may
   * never sign it. The SIGNATURE is the event, so treat this as a
   * convenience rather than a commitment.
   *
   * `lastValidBlockHeight` is when it expires. A wallet prompt left open
   * for a couple of minutes produces a transaction the chain rejects, so
   * re-quote rather than retry — "this quote expired" is a much better
   * message than "your payment failed".
   *
   * `payerCanCover` is a courtesy read of their balance so you can warn
   * before a prompt rather than after a failure. Null means we could not
   * read it, which is not the same as "no".
   *
   * The buyer needs no prior wallet registration. A payment proves
   * control of the tokens, which is what a connect-and-verify step would
   * have been proving.
   */
  quote(params: { payerAddress: string; valueCents: number }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/wallet-payments/quote',
      body: params,
    });
  }

  /**
   * Present the signature. Returns a ship / do-not-ship decision.
   *
   * Everything is read from the CHAIN at finalized commitment — amount,
   * payer, destination. Nothing you assert about the payment is trusted,
   * because a client that can state its own payment amount can state a
   * larger one.
   *
   * `releaseDecision` is about the ORDER, not the payment. By the time
   * we see a signature the tokens have moved and cannot be un-moved, so
   * the only decision left is the merchandise:
   *
   *   `release` — ship it
   *   `review`  — hold; a person needs to look. Includes the case where
   *               no screening provider is configured.
   *   `refuse`  — do not ship. The payment is still recorded, because we
   *               received the tokens and that does not go away.
   *
   * Idempotent twice over: on `txSig` globally, so one payment cannot
   * pay two orders, and on (merchant, `externalId`), so one order is not
   * paid twice.
   *
   * A 409 means it has not finalized yet — retry. A 400 means it never
   * will be claimable.
   */
  confirm(params: {
    externalId: string;
    txSig: string;
    subjectId?: string;
    valueCents?: number;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/wallet-payments/confirm',
      body: params,
    });
  }

  /**
   * Payments held for a human — the ops queue.
   *
   * Every row is money taken and goods not shipped, which is not a state
   * to leave a buyer in without it appearing on a list. The risk fields
   * are the verdict as recorded at the time, not re-derived.
   */
  review() {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cbx/wallet-payments/review',
    });
  }

  /**
   * Resolve a held payment after a person looked at it.
   *
   * Only moves a payment OUT of `review`, never between the other two. A
   * refusal that could later be flipped to a release is an approval
   * control with no teeth, and a release re-decided as a refusal after
   * the goods shipped is a record that no longer describes what
   * happened.
   */
  resolve(paymentId: string, params: { decision: 'release' | 'refuse'; note: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cbx/wallet-payments/${encodeURIComponent(paymentId)}/resolve`,
      body: params,
    });
  }
}
