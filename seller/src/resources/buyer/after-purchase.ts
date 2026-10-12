// ── After purchase: orders, cases, feedback ──────────────────────────
//
// Composed onto `BuyerResource` as `buyer.orders`, `buyer.cases` and
// `buyer.feedback`. None of these spends money — cancelling REFUNDS.

import type { HttpClient, IdempotencyOpts } from '../_shared.js';

export interface OrderEligibility {
  orderId: string;
  status: string;
  canCancel: boolean;
  canMarkReceived: boolean;
  canLeaveFeedback: boolean;
  /** Present when you already left feedback — revise it by this id. */
  feedbackId: string | null;
  inr: {
    eligible: boolean;
    /** not_paid | refunded | case_exists | delivered | received | too_early | window_closed */
    reason?: string | null;
    opensAt?: string | null;
    closesAt?: string | null;
  };
  shippedAt: string | null;
  deliveredAt: string | null;
  estimatedDelivery: string | null;
  buyerReceivedAt: string | null;
  protectionEndsAt: string | null;
  refundedAt: string | null;
}

export interface BuyerCase {
  id: string;
  purchaseId: string;
  reason: string;
  state: string;
  awaitingParty?: string | null;
  escalateAfter?: string | null;
  offeredRefundCents?: number | null;
  resolvedRefundCents?: number | null;
  resolvedAt?: string | null;
  returnLabelUrl?: string | null;
  returnTrackingCode?: string | null;
  returnTrackingCarrier?: string | null;
  returnTrackingStatus?: string | null;
  returnDeliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  buyerPaidCents?: number | null;
  itemTitle?: string | null;
  itemThumbnail?: string | null;
  sellerName?: string | null;
  /** not_received | return | problem */
  kind: string;
  closed: boolean;
  /** The case is waiting on you. */
  yourTurn: boolean;
}

export interface BuyerCaseDetail {
  case: {
    id: string;
    purchaseId: string;
    sellerUserId: string;
    reason: string;
    buyerNote?: string | null;
    photoUrls?: string[] | null;
    state: string;
    awaitingParty?: string | null;
    escalateAfter?: string | null;
    offeredRefundCents?: number | null;
    resolvedRefundCents?: number | null;
    resolvedDecision?: string | null;
    resolvedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  purchase?: {
    id: string;
    buyerPaidCents: number;
    status: string;
    refundStatus?: string | null;
    refundAmountCents?: number | null;
  } | null;
  messages: Array<{
    id: string;
    authorRole: string;
    body: string;
    attachmentUrls?: string[] | null;
    kind: string;
    createdAt: string;
  }>;
  returnShipment?: {
    carrier?: string | null;
    trackingCode: string;
    trackingUrl?: string | null;
    labelUrl?: string | null;
    status?: string | null;
    statusDetail?: string | null;
    updatedAt?: string | null;
    deliveredAt?: string | null;
  } | null;
}

export interface PendingFeedback {
  purchaseId: string;
  itemTitle: string;
  imageUrl?: string | null;
  deliveredAt?: string | null;
  shippedAt?: string | null;
  orderedAt?: string | null;
  sellerName?: string | null;
}

export interface LeftFeedback {
  id: string;
  rating: number;
  body?: string | null;
  createdAt: string;
  revisedAt?: string | null;
  sellerReply?: string | null;
  sellerRepliedAt?: string | null;
  sellerName?: string | null;
  itemTitle?: string | null;
  ratingAsDescribed?: number | null;
  ratingCommunication?: number | null;
  ratingShipSpeed?: number | null;
  ratingShipCost?: number | null;
}

/** Detailed seller ratings, each 1-5. */
export interface DetailedRatings {
  ratingAsDescribed?: number;
  ratingCommunication?: number;
  ratingShipSpeed?: number;
  ratingShipCost?: number;
}

export interface FeedbackInput extends DetailedRatings {
  purchaseId: string;
  /** Overall stars, 1-5. */
  rating: number;
  body?: string;
}

export type SellerReportReason =
  | 'scam'
  | 'off_platform'
  | 'not_shipped'
  | 'counterfeit'
  | 'harassment'
  | 'fee_avoidance'
  | 'other';

export interface FeedbackOutcome {
  purchaseId: string;
  ok: boolean;
  /** Why this one was refused, e.g. review_blocked or "Purchase not found". */
  error?: string;
}

type Ok = { data: { ok: boolean } };

/** Acting on an order you placed. */
export class BuyerOrdersResource {
  constructor(private http: HttpClient) {}

  /** What you can do with an order right now. Requires `buyer:orders:read`. */
  eligibility(id: string) {
    return this.http.request<{ data: OrderEligibility }>({
      method: 'GET',
      path: `/v1/buyer/orders/${encodeURIComponent(id)}/eligibility`,
    });
  }

  /** Cancel before it ships — refunds in full. Requires `buyer:orders:write`. */
  cancel(id: string, opts?: IdempotencyOpts) {
    return this.http.request<{ data: { ok: boolean; refunded: boolean } }>({
      method: 'POST',
      path: `/v1/buyer/orders/${encodeURIComponent(id)}/cancel`,
      idempotencyKey: opts?.idempotencyKey,
    });
  }

  /** Confirm receipt. Does not release the seller's money sooner. Requires `buyer:orders:write`. */
  markReceived(id: string) {
    return this.http.request<{
      data: { ok: boolean; alreadyConfirmed?: boolean; buyerReceivedAt?: string; canReview: boolean };
    }>({
      method: 'POST',
      path: `/v1/buyer/orders/${encodeURIComponent(id)}/received`,
    });
  }

  /**
   * Open an item-not-received case. Too early answers 409 with
   * `details.opensAt`. Requires `buyer:orders:write`.
   */
  openNotReceived(id: string, input: { body: string; photoUrls?: string[] }, opts?: IdempotencyOpts) {
    return this.http.request<{ data: { ok: boolean; caseId: string | null } }>({
      method: 'POST',
      path: `/v1/buyer/orders/${encodeURIComponent(id)}/inr`,
      body: input,
      idempotencyKey: opts?.idempotencyKey,
    });
  }

  /**
   * Order history as CSV text in `data.csv`. `from`/`to` are YYYY-MM-DD.
   * Requires `buyer:orders:read`.
   */
  exportCsv(params: { from?: string; to?: string } = {}) {
    return this.http.request<{ data: { csv: string; filename: string; rowCount: number } }>({
      method: 'GET',
      path: '/v1/buyer/orders/export',
      query: params,
    });
  }

  /**
   * Tip the seller on a shipped order, charged to a saved card ($1–$500, one
   * per order). Requires `buyer:checkout:write`; counts against the key's
   * spending controls. 402 when the card wants confirmation.
   */
  tip(id: string, input: { amountCents: number; message?: string; paymentMethodId?: string }, opts?: IdempotencyOpts) {
    return this.http.request<{ data: { status: 'paid' } }>({
      method: 'POST',
      path: `/v1/buyer/orders/${encodeURIComponent(id)}/tip`,
      body: input,
      idempotencyKey: opts?.idempotencyKey,
    });
  }

  /** Report a seller to Crossly's trust team. Requires `buyer:orders:write`. */
  reportSeller(username: string, input: { reason: SellerReportReason; details?: string; purchaseId?: string }) {
    return this.http.request<{ data: { ok: boolean; reportId: string | null; updated: boolean } }>({
      method: 'POST',
      path: `/v1/buyer/sellers/${encodeURIComponent(username)}/report`,
      body: input,
    });
  }
}

/** The resolution center. */
export class BuyerCasesResource {
  constructor(private http: HttpClient) {}

  /** Your cases. Requires `buyer:orders:read`. */
  list(params: { status?: 'open' | 'closed' | 'all' } = {}) {
    return this.http.request<{ data: BuyerCase[]; meta?: { counts: { open: number; yourTurn: number } } }>({
      method: 'GET',
      path: '/v1/buyer/cases',
      query: params,
    });
  }

  /** One case with its thread. Requires `buyer:orders:read`. */
  get(id: string) {
    return this.http.request<{ data: BuyerCaseDetail }>({
      method: 'GET',
      path: `/v1/buyer/cases/${encodeURIComponent(id)}`,
    });
  }

  /** Accept or reject the seller's partial-refund offer. Requires `buyer:orders:write`. */
  respond(id: string, decision: 'accept' | 'reject', opts?: IdempotencyOpts) {
    return this.http.request<Ok>({
      method: 'POST',
      path: `/v1/buyer/cases/${encodeURIComponent(id)}/respond`,
      body: { decision },
      idempotencyKey: opts?.idempotencyKey,
    });
  }

  /** Propose your own refund, in cents. Requires `buyer:orders:write`. */
  counter(id: string, input: { amountCents: number; note?: string }) {
    return this.http.request<Ok>({
      method: 'POST',
      path: `/v1/buyer/cases/${encodeURIComponent(id)}/counter`,
      body: input,
    });
  }

  /** Post on the case thread. Requires `buyer:orders:write`. */
  message(id: string, input: { body: string; attachmentUrls?: string[] }) {
    return this.http.request<Ok>({
      method: 'POST',
      path: `/v1/buyer/cases/${encodeURIComponent(id)}/messages`,
      body: input,
    });
  }

  /** Ask Crossly to step in. Requires `buyer:orders:write`. */
  escalate(id: string) {
    return this.http.request<Ok>({
      method: 'POST',
      path: `/v1/buyer/cases/${encodeURIComponent(id)}/escalate`,
    });
  }

  /** Withdraw the case. Cannot be reopened. Requires `buyer:orders:write`. */
  withdraw(id: string) {
    return this.http.request<Ok>({
      method: 'POST',
      path: `/v1/buyer/cases/${encodeURIComponent(id)}/withdraw`,
    });
  }
}

/** Feedback you owe and have left. */
export class BuyerFeedbackResource {
  constructor(private http: HttpClient) {}

  /** Orders still waiting for your feedback. Requires `buyer:orders:read`. */
  pending() {
    return this.http.request<{ data: PendingFeedback[] }>({
      method: 'GET',
      path: '/v1/buyer/feedback/pending',
    });
  }

  /** Feedback you have left, with ids to revise by. Requires `buyer:orders:read`. */
  list() {
    return this.http.request<{ data: LeftFeedback[] }>({
      method: 'GET',
      path: '/v1/buyer/feedback',
    });
  }

  /**
   * Leave feedback on up to 25 orders. Each entry succeeds or fails on its
   * own — read `data[].ok`. Requires `buyer:feedback:write`.
   */
  submit(reviews: FeedbackInput[]) {
    // `FeedbackOutcome[]`, not `Array<…>`: the v1-parity scanner reads this
    // generic with `[^>]*`, and a nested `>` would hide the method from it.
    return this.http.request<{ data: FeedbackOutcome[]; meta?: { saved: number } }>({
      method: 'POST',
      path: '/v1/buyer/feedback',
      body: { reviews },
    });
  }

  /** Revise feedback within 60 days. Requires `buyer:feedback:write`. */
  revise(id: string, input: { rating: number; body?: string } & DetailedRatings) {
    return this.http.request<Ok>({
      method: 'PATCH',
      path: `/v1/buyer/feedback/${encodeURIComponent(id)}`,
      body: input,
    });
  }
}
