import type { HttpClient } from './_shared.js';

/** Seller loyalty club tiers (W8b): spend thresholds in cents, discounts in basis points (≤ 3000). */
export interface ClubMember { buyerUserId: string; name: string; spendCents: number; orders: number; tier: string | null; joinedAt: string }
export interface LoyaltyTierInput { name: string; minSpendCents: number; discountBps: number; perks?: string }
export interface SellerClub { id: string; name: string; description: string | null; active: boolean; memberCount: number; tiers: Array<{ id: string; name: string; minSpendCents: number; discountBps: number; perks: string | null; members: number }> }

/** Your loyalty club. Reading needs `customers:read`; saving `customers:write`. */
export class LoyaltyResource {
  constructor(private http: HttpClient) {}
  club() { return this.http.request<{ data: SellerClub | null }>({ method: 'GET', path: '/v1/loyalty/club' }); }
  save(input: { name: string; description?: string; active?: boolean; tiers: LoyaltyTierInput[] }) { return this.http.request<{ data: SellerClub }>({ method: 'PUT', path: '/v1/loyalty/club', body: input }); }
  members() { return this.http.request<{ data: ClubMember[] }>({ method: 'GET', path: '/v1/loyalty/members' }); }
}

/** Shop-the-look tags on your story / lookbook photos. Needs `listings:write`. Positions are fractions of the image. */
export class HotspotsResource {
  constructor(private http: HttpClient) {}
  set(input: { targetType: 'story' | 'story_v1' | 'collection'; targetId: string; spots: Array<{ platformListingId: string; x: number; y: number; label?: string }> }) {
    return this.http.request<{ data: unknown[] }>({ method: 'PUT', path: '/v1/hotspots', body: input });
  }
}
