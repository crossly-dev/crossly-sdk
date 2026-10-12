import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Pop-up stalls + street events ──────────────────────────────────────────
//
// A stall is a seller renting a curb spot on a Crossly World street for a day,
// or a spot at a Night Market (Fridays) / Swap Meet (Sundays), showing up to 6
// of their live listings. Paid up front on card (your saved card), Crossly
// Bucks or CBX — a privately owned spot takes CBX only. Cancel before it opens
// for a full refund on the same rail; final once open.

export type StallRail = 'card' | 'bucks' | 'cbx';
export type StallOwnerKind = 'platform' | 'plot' | 'street';
export type StallLayoutKind = 'day' | 'night_market' | 'swap_meet';
export type StallAwningColour = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink' | 'cream' | 'charcoal';
export type StallAwningPattern = 'solid' | 'stripe' | 'scallop' | 'check';
export interface StallAwning { colour: StallAwningColour; pattern: StallAwningPattern }

type V3 = [number, number, number];

export interface StallListing { listingId: string; slug: string; title: string; priceCents: number; imageUrl: string | null }

export interface StreetStall {
  bookingId: string;
  spotIndex: number;
  kind: StallLayoutKind;
  position: V3;
  rotationY: number;
  footprint: { w: number; d: number };
  opensAt: string;
  closesAt: string;
  open: boolean;
  awning: StallAwning | null;
  sign: string | null;
  attendant: boolean;
  seller: { name: string; shop: { name: string; slug: string } | null };
  listings: StallListing[];
}

export interface FreeStallSpot { spotIndex: number; position: V3; rotationY: number; owner: StallOwnerKind; bookable: boolean; priceCents: number }

export interface StreetEvent {
  id: string;
  kind: 'night_market' | 'swap_meet';
  title: string;
  startsAt: string;
  endsAt: string;
  live: boolean;
  scheduled: boolean;
}

export interface StallQuoteLine { label: string; cents: number }

export interface StallQuote {
  street: string;
  spotIndex: number;
  owner: { kind: StallOwnerKind; isCrossly: boolean };
  open: boolean;
  units: Array<{ key: string; startsAt: string; endsAt: string; cents: number }>;
  quote: { rate: 'day' | 'night'; count: number; unitCents: number[]; lines: StallQuoteLine[]; totalCents: number; premiumMultiplier: number; demandPricing: boolean; mode: string; shareBps: number };
  rails: StallRail[];
  bookable: boolean;
}

export interface StallBooking {
  id: string;
  street: string;
  spotIndex: number;
  unit: 'day' | 'event';
  units: Array<{ key: string; startsAt: string; endsAt: string; cents: number }>;
  startsAt: string;
  endsAt: string;
  status: 'booked' | 'cancelled' | 'folded' | 'ended';
  rail: StallRail;
  owner: { kind: StallOwnerKind; isCrossly: boolean };
  totalCents: number;
  refundedCents: number;
  cancellable: boolean;
  listingIds: string[];
  awning: StallAwning | null;
  sign: string | null;
  attendant: boolean;
  /** `sales` counts sales of the stall's listings WHILE it was up (window, not click-through). */
  stats: { visits: number; offers: number; sales?: number };
  createdAt: string;
}

export type BookStallBody =
  | { street: string; spotIndex: number; rail: StallRail; unit: 'day'; startDate: string; days: number }
  | { street: string; spotIndex: number; rail: StallRail; unit: 'event'; eventIds: string[] };

export interface UpdateStallBody {
  listingIds?: string[];
  awning?: StallAwning;
  sign?: string | null;
  attendant?: boolean;
}

export type QuoteStallParams =
  | { street: string; spot: number; unit?: 'day'; start: string; days?: number }
  | { street: string; spot: number; unit: 'event'; events: string[] };

export class StallsResource {
  constructor(private http: HttpClient) {}

  /** Today's stalls on a street (live listings only) and the spots still free. */
  streetStalls(street: string) {
    return this.http.request<{ data: StreetStall[]; meta?: { street?: unknown; date?: string; phase?: unknown; free?: unknown } }>({
      method: 'GET', path: `/v1/streets/${encodeURIComponent(street)}/stalls`,
    });
  }

  /** Current and upcoming Night Markets and Swap Meets on a street. */
  streetEvents(street: string) {
    return this.http.request<{ data: StreetEvent[]; meta?: { street?: string } }>({ method: 'GET', path: `/v1/streets/${encodeURIComponent(street)}/events` });
  }

  /** Quote a spot for some days or some street events. */
  quote(params: QuoteStallParams) {
    const query: Record<string, string> = { street: params.street, spot: String(params.spot) };
    if (params.unit === 'event') {
      query.unit = 'event';
      query.events = params.events.join(',');
    } else {
      query.unit = 'day';
      query.start = params.start;
      if (params.days != null) query.days = String(params.days);
    }
    return this.http.request<{ quote: StallQuote }>({ method: 'GET', path: '/v1/stalls/quote', query });
  }

  /** Your bookings, newest first, with stats. */
  listMine() {
    return this.http.request<{ data: StallBooking[] }>({ method: 'GET', path: '/v1/stalls/mine' });
  }

  /** Book and pay for a stall. Needs a full-access token and an idempotencyKey (reuse it on retries). */
  book(body: BookStallBody, opts: IdempotencyOpts = {}) {
    return this.http.request<{ booking: StallBooking }>({ method: 'POST', path: '/v1/stalls/book', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Change a booked stall's listings, awning, sign or attendant. */
  update(bookingId: string, body: UpdateStallBody) {
    return this.http.request<{ booking: StallBooking }>({ method: 'PATCH', path: `/v1/stalls/bookings/${encodeURIComponent(bookingId)}`, body });
  }

  /** Cancel before it opens: full refund on the same rail. */
  cancel(bookingId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ cancelled: boolean; refundedCents: number; rail: StallRail }>({
      method: 'POST', path: `/v1/stalls/bookings/${encodeURIComponent(bookingId)}/cancel`, idempotencyKey: opts.idempotencyKey,
    });
  }
}
