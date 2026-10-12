import type { HttpClient, JsonObject, IdempotencyOpts } from './_shared.js';

// ─── The Crossly NFT marketplace ─────────────────────────────────────────────
export class NftMarketResource {
  constructor(private http: HttpClient) {}

  /** Open on-platform NFT listings. Envelope: `{ listings }`. */
  listListings() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/nft-market/listings' });
  }

  /** List an NFT you own for resale. */
  createListing(body: { ownershipId: string; priceCents: number }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/nft-market/listings', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Cancel one of your open listings. */
  cancelListing(id: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/nft-market/listings/${encodeURIComponent(id)}/cancel`, body: {} });
  }

  /** Ops: record a finalized on-Crossly NFT sale. Admin PAT only. */
  confirmSale(id: string, body: { buyerUserId: string; txSig: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/nft-market/listings/${encodeURIComponent(id)}/confirm-sale`, body });
  }

  /** Ops: record a Crossly NFT resold on any marketplace. Admin PAT only. */
  externalResale(body: { mintAddress: string; grossSaleCents: number; txSig: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/nft-market/external-resale', body });
  }
}
