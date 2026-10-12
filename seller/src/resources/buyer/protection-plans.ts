// ── Protection plans ────────────────────────────────────────────────
//
// Composed onto `BuyerResource` as `buyer.protectionPlans`. Extended
// warranties bought at checkout (`protectionPlanId`), insured by the
// partner; listed and cancelled here.

import type { HttpClient } from '../_shared.js';

export interface ProtectionPlan {
  id: string;
  purchaseId: string | null;
  /** paid (filing with the insurer) | active (contract issued) | cancelled */
  status: string;
  title: string;
  termMonths: number | null;
  coverage: string | null;
  termsUrl: string | null;
  /** Premium paid, cents. */
  priceCents: number;
  /** Refunded on cancellation, cents. */
  refundCents: number | null;
  contractId: string | null;
  itemTitle: string | null;
  createdAt: string;
}

/** Paying with USDC (Stripe stablecoin payments): availability and limit. The charge itself needs the buyer's wallet, so it happens in the browser checkout. */
export class BuyerUsdcResource {
  constructor(private http: HttpClient) {}

  availability() {
    return this.http.request<{ data: { available: boolean; reason: string | null; maxCents: number; networks: string[] } }>({ method: 'GET', path: '/v1/buyer/checkout/usdc' });
  }
}

/** Protection plans. Reading needs `buyer:orders:read`; cancelling `buyer:orders:write`. */
export class BuyerProtectionPlansResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.request<{ data: ProtectionPlan[] }>({ method: 'GET', path: '/v1/buyer/protection-plans' });
  }

  /** Cancel: the insurer's refundable amount goes back to the card. */
  cancel(id: string) {
    return this.http.request<{ data: { refundCents: number } }>({ method: 'POST', path: `/v1/buyer/protection-plans/${encodeURIComponent(id)}/cancel` });
  }
}
