import type { HttpClient, JsonObject, IdempotencyOpts } from './_shared.js';

export interface ProductionSpecInput {
  category: string;
  materialTier: 'standard' | 'premium' | 'luxury';
  complexity: 'simple' | 'moderate' | 'complex';
  packaging: 'poly' | 'box' | 'premium_box';
  customHardware?: boolean;
}

export interface AcceptProductionTermsBody {
  editionSize: number;
  retailPriceCents: number;
  /** Run cost self-determines from the design's spec; manual unit cost is a fallback. */
  unitCostCents?: number;
  spec?: ProductionSpecInput | null;
  designerRoyaltyBps?: number;
  holderPriority?: boolean;
  holderPriceCents?: number | null;
}

export interface ProductionBriefInput {
  materials?: string | null;
  finish?: string | null;
  colorway?: string | null;
  packaging?: string | null;
  dimensions?: string | null;
  notes?: string | null;
  referenceImageUrls?: string[];
  box?: Record<string, unknown> | null;
}

export interface UpdateProductionPoBody {
  supplierName?: string | null;
  supplierContact?: string | null;
  freightMode?: 'sea' | 'air' | 'express' | null;
  status?: 'sourcing' | 'quoted' | 'sampling' | 'sample_approved' | 'in_production' | 'shipped' | 'received' | 'cancelled';
  actualUnitFobCents?: number | null;
  actualToolingCents?: number | null;
  actualSamplesCents?: number | null;
  actualFreightCents?: number | null;
  actualDutyCents?: number | null;
  actualQcCents?: number | null;
  actualThreeplCents?: number | null;
  sampleRounds?: number;
  qcStatus?: 'pending' | 'passed' | 'failed' | null;
  qcNotes?: string | null;
  trackingCode?: string | null;
  notes?: string | null;
}

// ─── Proof-of-Demand physical production ─────────────────────────────────────
export class ProductionResource {
  constructor(private http: HttpClient) {}

  /** The ballot: designs waiting for a run, most backed first. Envelope: `{ ballot, canVote }`. */
  listBallot() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/production/ballot' });
  }

  /** Back (true) or un-back a design on the ballot. One vote per person per design. */
  vote(candidateId: string, support: boolean) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/production/candidates/${encodeURIComponent(candidateId)}/vote`, body: { support } });
  }

  /** Crossly provenance behind a shop listing (owners, since). Envelope: `{ provenance }`. */
  listingProvenance(slug: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/shop/listings/${encodeURIComponent(slug)}/provenance` });
  }

  /** Sell it again: a draft listing of a Crossly purchase, carrying its receipt. Returns `{ listingId, created }`. */
  relistReceipt(receiptId: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/receipts/${encodeURIComponent(receiptId)}/relist` });
  }

  /** Open limited-edition physical runs. Envelope: `{ runs }`. */
  listRuns() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/production/runs' });
  }

  /** Your designs that have graduated toward a run. Envelope: `{ candidates }`. */
  listCandidates() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/production/candidates' });
  }

  /** Accept a graduated design's production terms. */
  acceptTerms(candidateId: string, body: AcceptProductionTermsBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/production/candidates/${encodeURIComponent(candidateId)}/accept`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Buy a limited-edition unit of a run (holder pricing applies). */
  purchase(runId: string, body: { paymentRef?: string | null } = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/production/runs/${encodeURIComponent(runId)}/purchase`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your production-lines dashboard (candidate + run + inventory). Envelope: `{ lines }`. */
  listLines() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/production/lines' });
  }

  /** Limited-edition units you own, with fulfillment status. Envelope: `{ drops }`. */
  listDrops() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/production/drops' });
  }

  /** Your CBX earnings from physical production (royalties + balance + lines). Envelope: `{ earnings }`. */
  earnings() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/production/earnings' });
  }

  /** Estimate a run's landed cost from a spec + edition size. Envelope: `{ estimate }`. */
  estimate(body: { spec: ProductionSpecInput; editionSize: number }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/production/estimate', body });
  }

  /** Read a design's production preferences. Envelope: `{ prefs }`. */
  getDesignPrefs(cosmeticId: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/production/designs/${encodeURIComponent(cosmeticId)}/prefs` });
  }

  /** Set a design's production spec (self-determines run cost). */
  setDesignSpec(cosmeticId: string, spec: ProductionSpecInput) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/production/designs/${encodeURIComponent(cosmeticId)}/spec`, body: spec });
  }

  /** Set a design's production brief (IRL direction — materials, box, refs). */
  setDesignBrief(cosmeticId: string, brief: ProductionBriefInput) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/production/designs/${encodeURIComponent(cosmeticId)}/brief`, body: brief as unknown as JsonObject });
  }

  /** Opt a design in or out of physical production. */
  setDesignConsent(cosmeticId: string, optOut: boolean) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/production/designs/${encodeURIComponent(cosmeticId)}/consent`, body: { optOut } });
  }

  // ── Ops: sourcing / PO tracker (admin PAT only) ────────────────────────────
  /** Ops: list purchase orders (optionally for one candidate). Envelope: `{ pos }`. */
  listPos(candidateId?: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/production/pos', query: candidateId ? { candidateId } : undefined });
  }

  /** Ops: reconcile a PO's actuals against the estimate. Envelope: `{ reconciliation }`. */
  reconcilePo(poId: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/production/pos/${encodeURIComponent(poId)}/reconcile` });
  }

  /** Ops: open a purchase order for a candidate. */
  createPo(candidateId: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/production/candidates/${encodeURIComponent(candidateId)}/po`, body: {} });
  }

  /** Ops: update a PO (supplier, freight, actuals, QC, status). */
  updatePo(poId: string, body: UpdateProductionPoBody) {
    return this.http.request<JsonObject>({ method: 'PATCH', path: `/v1/production/pos/${encodeURIComponent(poId)}`, body: body as unknown as JsonObject });
  }
}
