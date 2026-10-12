import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Drops and lines (Crossly World) ────────────────────────────────────────
//
// A drop is a limited release with a line outside the shop door and a provably
// fair draw instead of a click race. When the line opens the server commits to
// a secret seed by publishing sha256(seed); at release it reveals the seed and
// the draw order, so anybody can recompute it (drawWinners in
// @crosslister/shared, or the steps in the drop's `drawVersion`). Winners get a
// 15-minute checkout hold on crossly.net; a lapsed hold passes to the next
// entry in draw order. Place in the line is cosmetic.

export type DropStatus = 'scheduled' | 'line_open' | 'released' | 'closed' | 'cancelled';
export type DropEligibility = 'signed_in' | 'verified';
export type DropOutcome = 'won' | 'waitlist' | 'expired' | 'claimed';

export interface DropListing { listingId: string; slug: string; title: string; priceCents: number; imageUrl: string | null }

export interface PublicDrop {
  id: string;
  title: string;
  status: DropStatus;
  units: number;
  eligibility: DropEligibility;
  opensLineAt: string;
  releaseAt: string;
  /** sha256(seed), hex; null until the line opens. */
  seedHash: string | null;
  /** Revealed at release; null before. */
  seed: string | null;
  drawVersion: string;
  entries: number;
  /** After release: sorted entry ids and the draw order. */
  entryIds: string[] | null;
  order: string[] | null;
  truncated: boolean;
  claimed: number;
  seller: { name: string; shop: { name: string; slug: string } | null };
  listings: DropListing[];
  street: { slug: string; plotIndex: number | null; stallSpotIndex: number | null } | null;
}

export interface SellerDrop extends PublicDrop {
  listingIds: string[];
  stats: { entries: number; won: number; claimed: number; waitlist: number; expired: number };
  editable: boolean;
}

export interface StreetDrop {
  id: string;
  title: string;
  status: DropStatus;
  opensLineAt: string;
  releaseAt: string;
  units: number;
  entries: number;
  plotIndex: number | null;
  stallSpotIndex: number | null;
  imageUrl: string | null;
}

export interface MyDropEntry {
  entryId: string | null;
  joinedAt: string | null;
  inLine: boolean;
  place: number | null;
  drawRank: number | null;
  outcome: DropOutcome | null;
  holdExpiresAt: string | null;
  checkoutPath: string | null;
  eligible: boolean;
  ineligibleReason: string | null;
}

export interface CreateDropBody {
  title: string;
  /** 1-10 of your live Crossly listing ids. */
  listingIds: string[];
  /** How many can be won: at most the listings' combined stock. */
  units: number;
  /** ISO. At least 5 minutes before releaseAt, at most 72 hours. */
  opensLineAt: string;
  releaseAt: string;
  eligibility?: DropEligibility;
}
export type UpdateDropBody = Partial<CreateDropBody>;

export class DropsResource {
  constructor(private http: HttpClient) {}

  /** One drop; the seed and draw order once released. */
  get(id: string) {
    return this.http.request<{ drop: PublicDrop }>({ method: 'GET', path: `/v1/drops/${encodeURIComponent(id)}` });
  }

  /** Upcoming, open and just-released drops on a street. */
  streetDrops(street: string) {
    return this.http.request<{ data: StreetDrop[]; meta?: { street?: string } }>({ method: 'GET', path: `/v1/streets/${encodeURIComponent(street)}/drops` });
  }

  /** Your drops with their results. */
  listMine() {
    return this.http.request<{ data: SellerDrop[] }>({ method: 'GET', path: '/v1/drops/mine' });
  }

  /** Set up a drop. */
  create(body: CreateDropBody, opts: IdempotencyOpts = {}) {
    return this.http.request<{ drop: SellerDrop }>({ method: 'POST', path: '/v1/drops', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Change a drop before its line opens. */
  update(id: string, body: UpdateDropBody) {
    return this.http.request<{ drop: SellerDrop }>({ method: 'PATCH', path: `/v1/drops/${encodeURIComponent(id)}`, body });
  }

  /** Call a drop off before its line opens. */
  cancel(id: string) {
    return this.http.request<{ cancelled: boolean }>({ method: 'DELETE', path: `/v1/drops/${encodeURIComponent(id)}` });
  }

  /** Join a drop's line (one entry per account; same odds as in the world). */
  join(id: string) {
    return this.http.request<{ entryId: string; joined: boolean; me: MyDropEntry }>({ method: 'POST', path: `/v1/buyer/drops/${encodeURIComponent(id)}/join` });
  }

  /** Leave a drop's line before the draw. */
  leave(id: string) {
    return this.http.request<{ left: boolean }>({ method: 'DELETE', path: `/v1/buyer/drops/${encodeURIComponent(id)}/join` });
  }

  /** Your entry: outcome, and the checkout path while your hold is live. */
  me(id: string) {
    return this.http.request<{ me: MyDropEntry }>({ method: 'GET', path: `/v1/buyer/drops/${encodeURIComponent(id)}/me` });
  }
}
