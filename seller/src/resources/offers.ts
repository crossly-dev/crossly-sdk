import type { HttpClient, JsonObject, IdempotencyOpts } from './_shared.js';

export type OfferStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'countered'
  | 'expired'
  | 'withdrawn';

export interface OfferItem {
  slug: string;
  title: string | null;
  priceCents: number;
  /** False once the seller delists it — an offer covering it can no longer be redeemed. */
  active: boolean;
}

export interface Offer {
  id: string;
  status: OfferStatus;
  /** What the buyer offered for the WHOLE set. */
  amountCents: number;
  /**
   * Sum of the items' asking prices at the moment the offer was made.
   * Snapshotted, so it still reflects what the buyer responded to after the
   * listings are edited. Null on offers predating bundles.
   */
  listedTotalCents: number | null;
  /** True when the offer covers more than one listing. */
  isBundle: boolean;
  items: OfferItem[];
  message: string | null;
  /** Set on a counter-offer, pointing at the offer it answers. */
  parentOfferId: string | null;
  expiresAt: string;
  decidedAt: string | null;
  /** Set once an accepted offer has actually been paid for. */
  consumedAt: string | null;
  createdAt: string;
}

export type OfferRespond =
  | { action: 'accept' }
  | { action: 'decline' }
  | { action: 'counter'; counterCents: number };

// ─── Offers on your Crossly marketplace listings ────────────────────────────
//
// Separate from `comms.offer()` / `comms.offerAction()`, which act on offers
// attached to a CONVERSATION on an external marketplace. Crossly-native offers
// are standalone and a buyer can build one covering several listings at once,
// which a conversation-scoped, single-listing shape cannot express.

export class OffersResource {
  constructor(private http: HttpClient) {}

  /**
   * List buyer offers on your Crossly marketplace listings, newest first.
   * Envelope: `{ offers }`.
   */
  list(params: { status?: OfferStatus; limit?: number } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/offers',
      query: params,
    });
  }

  /**
   * Accept, decline, or counter a pending offer.
   *
   * Accepting grants the buyer a one-time right to buy every covered item at
   * the agreed price. Countering opens a child offer over the SAME item set.
   */
  respond(id: string, body: OfferRespond, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/offers/${encodeURIComponent(id)}/respond`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}
