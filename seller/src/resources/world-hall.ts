import type { HttpClient } from './_shared.js';

// ─── The Hall of Grails in Crossly World ─────────────────────────────────────
//
// A museum whose exhibits are real catalogue items with their live order
// book: a new exhibition every Monday (UTC), the twelve most popular
// photographed items of its query on the plinths and frames. Buy, bid or
// watch an exhibit through the market with its skuId. Reads need activity:read.

export interface HallExhibit {
  skuId: string;
  name: string;
  brand: string | null;
  imageUrl: string;
  thumbUrl: string | null;
  retailCents: number | null;
  /** The live order book: null when the market has no ask / no sale yet. */
  lowestAskCents: number | null;
  lastSaleCents: number | null;
  /** Lent by a member from their vault: their plaque line. */
  loan?: { lender: string; grade: string | null } | null;
}

/** Your Lend-to-the-Hall desk. */
export interface HallLoanDesk {
  exhibition: { key: string; title: string; categorySlug: string; endsAt: string };
  perMember: number;
  loans: Array<{ id: string; vaultItemId: string; skuId: string; name: string | null; credit: 'name' | 'anonymous'; since: string }>;
  eligible: Array<{ vaultItemId: string; skuId: string; name: string; imageUrl: string | null; grade: string | null }>;
}

export interface HallView {
  exhibition: { key: string; title: string; blurb: string; endsAt: string; next: string };
  /** In slot order: the first stands on the centre plinth. */
  exhibits: HallExhibit[];
}

export class WorldHallResource {
  constructor(private http: HttpClient) {}

  /** This week's exhibition and its exhibits. */
  get() {
    return this.http.request<{ data: HallView }>({ method: 'GET', path: '/v1/world/hall' });
  }

  /** Lend to the Hall: your loans this week and the vault pieces you can lend. */
  loans() {
    return this.http.request<{ data: HallLoanDesk }>({ method: 'GET', path: '/v1/world/hall/loans' });
  }

  /** Put one of your vault pieces on show this week (world:write). */
  lend(body: { vaultItemId: string; credit?: 'name' | 'anonymous' }) {
    return this.http.request<{ data: { id: string; exhibition: string; endsAt: string } }>({ method: 'POST', path: '/v1/world/hall/loans', body });
  }

  /** Take a loan off show (world:write). */
  withdrawLoan(id: string) {
    return this.http.request<{ data: { id: string } }>({ method: 'DELETE', path: `/v1/world/hall/loans/${encodeURIComponent(id)}` });
  }
}
