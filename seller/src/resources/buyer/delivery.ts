// ── Where it goes: pickup points and ship-together ───────────────────
//
// Composed onto `BuyerResource` as `buyer.delivery`.

import type { HttpClient } from '../_shared.js';

/** A UPS Access Point or FedEx Hold at Location. Pass one as `pickupPoint` to `buyer.buy()`. */
export interface PickupPoint {
  carrier: 'ups' | 'fedex';
  id: string;
  name: string;
  address: { line1: string; line2?: string | null; city: string; state: string; zip: string; country: string };
  distanceMi: number | null;
  hours: string | null;
}

export interface PurchaseDelivery {
  pickupPoint: (PickupPoint & { releaseCode?: string | null }) | null;
  trackingNumber: string | null;
  carrier: string | null;
  consolidation: { id: string; status: string; received: number; total: number; outboundTracking: string | null; outboundCarrier: string | null } | null;
}

type Row = Record<string, unknown>;

export class BuyerDeliveryResource {
  constructor(private http: HttpClient) {}

  /** Points near an address. `meta.enabled` is false when no carrier is configured. Requires `buyer:catalog:read`. */
  pickupPoints(near: { zip: string; line1?: string; city?: string; state?: string; country?: string }) {
    return this.http.request<{ data: PickupPoint[]; meta: { enabled: boolean } }>({ method: 'GET', path: '/v1/buyer/pickup-points', query: near });
  }

  /** The pickup point a purchase is held at, or its consolidation. Requires `buyer:orders:read`. */
  purchase(purchaseId: string) {
    return this.http.request<{ data: PurchaseDelivery }>({ method: 'GET', path: `/v1/buyer/purchases/${encodeURIComponent(purchaseId)}/delivery` });
  }

  /** Ship-together orders. Requires `buyer:orders:read`. */
  consolidations() {
    return this.http.request<{ data: Row[] }>({ method: 'GET', path: '/v1/buyer/consolidations' });
  }
}
