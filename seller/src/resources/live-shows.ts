import type { HttpClient } from './_shared.js';

/**
 * Live shows (W8a): a show's lineup, the replay moment a purchase sold at,
 * and one box per buyer per show.
 */
export interface LineupItem { platformListingId: string; position: number; slug: string | null; title: string | null; priceCents: number; imageUrl: string | null; available: boolean; pinned: boolean }
export interface LiveMoment { streamId: string; title: string; sellerUserId: string; status: string; replayUrl: string | null; offsetSeconds: number; soldAt: string }
export interface ShowShipment {
  id: string; streamId: string; streamTitle: string;
  /** open | shipped */
  status: string;
  buyerName: string | null; trackingNumber: string | null; carrier: string | null; labelUrl: string | null;
  /** Postage refunded to the buyer when the box shipped, cents. */
  refundedPostageCents: number;
  orders: Array<{ orderId: string; purchaseId: string; title: string | null; shippingCents: number; orderStatus: string | null }>;
}
export interface SentGift { id: string; recipientName: string; recipientEmail: string; status: string; teaserSentAt: string | null; revealedAt: string | null; openedAt: string | null; thanksMessage: string | null; createdAt: string; url: string }

/** Seller side. Lineup needs `listings:write`; boxes `orders:read` / `orders:write`. */
export class LiveShowsResource {
  constructor(private http: HttpClient) {}

  setLineup(streamId: string, platformListingIds: string[]) {
    return this.http.request<{ data: LineupItem[] }>({ method: 'PUT', path: `/v1/live-streams/${encodeURIComponent(streamId)}/lineup`, body: { platformListingIds } });
  }

  shipments(params: { streamId?: string; status?: 'open' | 'shipped' } = {}) {
    return this.http.request<{ data: ShowShipment[] }>({ method: 'GET', path: '/v1/live-shipments', query: params });
  }

  /** One label for the whole box; extra postage is refunded to the buyer. */
  buyLabel(shipmentId: string) {
    return this.http.request<{ data: ShowShipment }>({ method: 'POST', path: `/v1/live-shipments/${encodeURIComponent(shipmentId)}/label` });
  }

  ship(shipmentId: string, input: { trackingNumber: string; carrier?: string }) {
    return this.http.request<{ data: ShowShipment }>({ method: 'POST', path: `/v1/live-shipments/${encodeURIComponent(shipmentId)}/ship`, body: input });
  }
}

/** Buyer side (`buyer.liveShows`). */
export class BuyerLiveShowsResource {
  constructor(private http: HttpClient) {}

  lineup(streamId: string) {
    return this.http.request<{ data: LineupItem[] }>({ method: 'GET', path: `/v1/buyer/live-streams/${encodeURIComponent(streamId)}/lineup` });
  }

  /** Where in the replay a purchase sold; null when it was not bought in a show. */
  moment(purchaseId: string) {
    return this.http.request<{ data: LiveMoment | null }>({ method: 'GET', path: `/v1/buyer/purchases/${encodeURIComponent(purchaseId)}/live-moment` });
  }

  shipments() {
    return this.http.request<{ data: ShowShipment[] }>({ method: 'GET', path: '/v1/buyer/live-shipments' });
  }

  /** Items you sent as gifts (send one with `gift` on checkout). */
  giftsSent() {
    return this.http.request<{ data: SentGift[] }>({ method: 'GET', path: '/v1/buyer/gifts/sent' });
  }
}
