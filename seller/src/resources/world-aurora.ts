import type { HttpClient } from './_shared.js';

// ─── The Sales Aurora in Crossly World ───────────────────────────────────────
//
// Every real sale on Crossly in the last 30 days is a ribbon of light in the
// Commons' night sky, coloured by what kind of thing sold; a sale in the last
// ten minutes shimmers. Aggregate only: no item, price, seller or platform.
// Reads need activity:read.

export type AuroraFamilyKey = 'cards' | 'coins' | 'jewellery' | 'electronics' | 'media' | 'fashion' | 'toys' | 'other';

export interface AuroraView {
  windowDays: number;
  /** Sales in the window. */
  total: number;
  families: Array<{ key: AuroraFamilyKey; label: string; colour: string; count: number }>;
  /** Newest first, at most 48. `fresh`: sold in the last ten minutes. */
  sales: Array<{ family: AuroraFamilyKey; ageHours: number; fresh: boolean }>;
  updatedAt: string;
}

export class WorldAuroraResource {
  constructor(private http: HttpClient) {}

  /** The last month's sales, as the Commons sky shows them. */
  get() {
    return this.http.request<{ data: AuroraView }>({ method: 'GET', path: '/v1/world/aurora' });
  }
}
