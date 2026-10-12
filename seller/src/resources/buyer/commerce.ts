// ── Offers + auctions ────────────────────────────────────────────────
//
// Composed onto `BuyerResource` as `buyer.offers` and `buyer.auctions`.
// Every method needs a BUYER token (`crossly_oat_…`, scoped `buyer:*`).
//
// Bidding SPENDS MONEY: a winning bid is charged to a saved card when the
// auction closes, with nobody present. It therefore needs
// `buyer:checkout:write` AND the key switched on with a ceiling
// (`buyer.setCheckoutControls`), exactly like `buyer.buy`.

import type { HttpClient, IdempotencyOpts } from '../_shared.js';

export interface BuyerOfferItem {
  id: string;
  slug?: string | null;
  title?: string | null;
  priceCents: number;
  thumbnail?: string | null;
  status?: string | null;
}

export interface BuyerOffer {
  id: string;
  platformListingId: string;
  platformListingIds?: string[] | null;
  listedTotalCents?: number | null;
  sellerUserId: string;
  /** The offer amount for the whole set, in cents. */
  amountCents: number;
  message?: string | null;
  status: string;
  parentOfferId?: string | null;
  /** null = you made it; seller_counter / buyer_counter / second_chance otherwise. */
  origin?: string | null;
  expiresAt: string;
  decidedAt?: string | null;
  consumedAt?: string | null;
  createdAt: string;
  items: BuyerOfferItem[];
  isBundle: boolean;
  /** Accepted and still payable on Crossly. */
  redeemable: boolean;
  expired: boolean;
  /** A seller counter waiting on you. */
  awaitingBuyer: boolean;
}

export interface MyAuction {
  slug?: string | null;
  title: string;
  thumbnail?: string | null;
  endsAt?: string | null;
  status?: string | null;
  currentCents?: number | null;
  bidCount: number;
  myMaxCents?: number | null;
  leading: boolean;
  winningCents?: number | null;
  paid: boolean;
}

export interface AuctionBid {
  /** "You" for your own bids, otherwise anonymised. */
  bidder: string;
  amountCents: number;
  placedAt?: string | null;
}

export interface MyAuctionStatus {
  bidding: boolean;
  myMaxCents?: number | null;
  leading?: boolean;
  won?: boolean;
  needsPayment?: boolean;
}

export type RespondToOfferInput =
  | { action: 'accept' | 'decline' }
  | { action: 'counter'; counterCents: number };

export interface PlaceBidInput {
  /** Your bid now, in cents. */
  amountCents: number;
  /** Proxy ceiling, in cents. */
  maxBidCents?: number;
  /** A saved card to charge if you win. Omit for your default card. */
  paymentMethodId?: string;
}

export interface BidResult {
  ok: boolean;
  /** false = a standing proxy bid outbid you straight away. */
  leading: boolean;
  currentBidCents: number;
  endsAt: string;
}

/** Offers you have made, and answering a seller's counter. */
export class BuyerOffersResource {
  constructor(private http: HttpClient) {}

  /**
   * Your offers, newest first. Pass `awaitingBuyer: true` for only the seller
   * counters waiting on you. Requires `buyer:offers:read`.
   */
  list(params: { awaitingBuyer?: boolean } = {}) {
    return this.http.request<{ data: BuyerOffer[]; meta?: { awaitingBuyerCount: number } }>({
      method: 'GET',
      path: '/v1/buyer/offers',
      query: params.awaitingBuyer === undefined ? {} : { awaitingBuyer: String(params.awaitingBuyer) },
    });
  }

  /**
   * Accept, decline, or counter a seller's counteroffer. Accepting charges
   * nothing — it opens a 48-hour window to pay on Crossly. Requires
   * `buyer:offers:write`.
   */
  respond(id: string, input: RespondToOfferInput, opts?: IdempotencyOpts) {
    return this.http.request<{ data: { status: string; redeemable?: boolean; offerId?: string } }>({
      method: 'POST',
      path: `/v1/buyer/offers/${encodeURIComponent(id)}/respond`,
      body: input,
      idempotencyKey: opts?.idempotencyKey,
    });
  }

  /** Withdraw an offer the seller has not answered. Requires `buyer:offers:write`. */
  withdraw(id: string) {
    return this.http.request<{ data: { ok: boolean } }>({
      method: 'DELETE',
      path: `/v1/buyer/offers/${encodeURIComponent(id)}`,
    });
  }
}

/** Auctions you are in: status, history, bidding, retracting, paying. */
export class BuyerAuctionsResource {
  constructor(private http: HttpClient) {}

  /** Auctions you have bid in. Requires `buyer:auctions:read`. */
  list(params: { tab?: 'bidding' | 'won' | 'lost' } = {}) {
    return this.http.request<{ data: MyAuction[]; meta?: { tab: string } }>({
      method: 'GET',
      path: '/v1/buyer/auctions',
      query: params,
    });
  }

  /** Bid history, highest first, bidders anonymised. Requires `buyer:auctions:read`. */
  bids(slug: string) {
    return this.http.request<{ data: AuctionBid[]; meta?: { bidCount: number; bidderCount: number } }>({
      method: 'GET',
      path: `/v1/buyer/auctions/${encodeURIComponent(slug)}/bids`,
    });
  }

  /** Where you stand in one auction. Requires `buyer:auctions:read`. */
  me(slug: string) {
    return this.http.request<{ data: MyAuctionStatus }>({
      method: 'GET',
      path: `/v1/buyer/auctions/${encodeURIComponent(slug)}/me`,
    });
  }

  /**
   * Place a bid. SPENDS MONEY IF YOU WIN. Requires `buyer:checkout:write` and
   * the key enabled with a ceiling; the bid's maximum is checked against it.
   * Always pass an idempotency key — a retried bid is a second bid.
   */
  bid(slug: string, input: PlaceBidInput, opts?: IdempotencyOpts) {
    return this.http.request<{ data: BidResult }>({
      method: 'POST',
      path: `/v1/buyer/auctions/${encodeURIComponent(slug)}/bids`,
      body: input,
      idempotencyKey: opts?.idempotencyKey,
    });
  }

  /** Retract your bids under eBay's rules. Requires `buyer:checkout:write`. */
  retract(slug: string, reason: 'typo' | 'listing_changed' | 'seller_unreachable') {
    return this.http.request<{ data: { retracted: number } }>({
      method: 'POST',
      path: `/v1/buyer/auctions/${encodeURIComponent(slug)}/retract`,
      body: { reason },
    });
  }

  /**
   * A won auction whose automatic charge failed: returns a Stripe client
   * secret to confirm on the buyer's device. Charges nothing itself.
   * Requires `buyer:checkout:write`.
   */
  pay(slug: string) {
    return this.http.request<{
      data: { paid: boolean; clientSecret?: string | null; paymentIntentId?: string; amountCents?: number };
    }>({
      method: 'POST',
      path: `/v1/buyer/auctions/${encodeURIComponent(slug)}/pay`,
    });
  }
}
