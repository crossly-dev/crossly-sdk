// ── Size memory ─────────────────────────────────────────────────────
//
// Composed onto `BuyerResource` as `buyer.sizeMemory`. (`buyer.fit` is the
// separate measurement check against saved reference garments.)

import type { HttpClient } from '../_shared.js';

export type FitAnswer = 'true_to_size' | 'small' | 'large';
export type SizeDomain = 'shoes' | 'dresses' | 'outerwear' | 'bottoms' | 'tops';
export interface BrandRuns { runs: 'small' | 'large' | 'true_to_size'; answers: number }
export interface ListingFit {
  domain: SizeDomain;
  /** The size you keep in this kind of item; null until your history says. */
  yourSize?: string | null;
  basis?: number;
  /** Your size in this brand specifically. */
  brandSize?: string | null;
  verdict?: 'your_size' | 'smaller' | 'larger' | 'different' | 'unknown';
  /** This brand and size ran small or large on you before. */
  warning?: 'ran_small' | 'ran_large' | null;
  brandRuns: BrandRuns | null;
}
export interface FitPrompt { purchaseId: string; title: string; brand: string | null; size: string | null; imageUrl: string | null }
export interface LearnedSize { domain: SizeDomain; department: 'men' | 'women' | 'kids' | 'unisex' | null; size: string; basis: number }

/** Your size, learned from what you kept. Reading needs `buyer:catalog:read` / `buyer:orders:read`; answering `buyer:orders:write`. */
export class BuyerSizeMemoryResource {
  constructor(private readonly http: HttpClient) {}
  /** This listing against your size. null for an unsized item. */
  forListing(slug: string) { return this.http.request<{ data: ListingFit | null }>({ method: 'GET', path: `/v1/buyer/catalog/listings/${encodeURIComponent(slug)}/my-size` }); }
  /** Delivered sized orders waiting on "how did it fit?". */
  prompts() { return this.http.request<{ data: FitPrompt[] }>({ method: 'GET', path: '/v1/buyer/size-memory/prompts' }); }
  /** Say how a delivered purchase fit. */
  answer(purchaseId: string, fit: FitAnswer) { return this.http.request<{ data: { ok: true } }>({ method: 'POST', path: `/v1/buyer/purchases/${encodeURIComponent(purchaseId)}/fit`, body: { fit } }); }
  /** The sizes learned from what you kept, by kind of item. */
  sizes() { return this.http.request<{ data: LearnedSize[] }>({ method: 'GET', path: '/v1/buyer/size-memory/sizes' }); }
}
