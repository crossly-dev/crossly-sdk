import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Crossly Grading ────────────────────────────────────────────────────────
//
// A Grading Run is one bulk submission Crossly sends to a grader at one tier.
// Reserving a slot is free; when the run reaches the grader's minimum by its
// cutoff it LOCKS and every reserved card is charged on the seller's saved
// card. A run that misses rolls its cards into the next open run (or releases
// them) and nothing is charged. Direct is the seller's own grader account:
// Crossly tracks it and verifies the cert, and takes no money.

export type GradingSubmissionStatus =
  | 'reserved'
  | 'charged'
  | 'shipped_to_hub'
  | 'received'
  | 'prescreen_failed'
  | 'at_grader'
  | 'graded'
  | 'returning'
  | 'returned'
  | 'vaulted'
  | 'released'
  | 'refunded';

export type GradingMissMode = 'roll_over' | 'release';
export type GradingReturnMode = 'return' | 'vault';

export interface GradingRun {
  id: string;
  graderSlug: string;
  graderName: string;
  tierSlug: string;
  tierName: string;
  /** Per card at the grader, in cents. */
  priceCents: number;
  /** Crossly's handling fee per card, in cents. */
  handlingCents: number;
  /** Shipping for the whole run, in cents, split over its cards. */
  shippingCents: number;
  minCards: number;
  capacity: number;
  held: number;
  cutoffAt: string;
  status: string;
  /** Against sending the same card alone at the grader's cheapest single-card tier, in cents. */
  savingsCents: number | null;
  note: string | null;
}

export interface GradingRate {
  graderSlug: string;
  graderName: string;
  tierSlug: string;
  tierName: string;
  /** Per card, in cents. null = the grader has paused this tier. */
  priceCents: number | null;
  minCards: number;
  maxDeclaredCents: number | null;
  source: string;
}

export interface GradingInfo {
  graderSlug: string;
  grade: string;
  qualifier?: string;
  sealGrade?: string;
  certNumber?: string;
  gradeKey: string;
  verifiedAt?: string;
}

export interface GradingSubmission {
  id: string;
  mode: 'run' | 'direct';
  runId: string | null;
  runCutoffAt: string | null;
  runStatus: string | null;
  graderSlug: string;
  graderName: string;
  tierSlug: string | null;
  inventoryItemId: string | null;
  title: string;
  declaredValueCents: number;
  prescreen: boolean;
  status: GradingSubmissionStatus;
  missMode: string;
  returnMode: string;
  chargedCents: number;
  refundedCents: number;
  /** The label to mail the card to the hub, once the run has locked. */
  inboundLabelUrl: string | null;
  inboundTracking: string | null;
  returnTracking: string | null;
  prescreenNote: string | null;
  grading: GradingInfo | null;
  certVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GradingWorth {
  inventoryItemId: string;
  title: string;
  /** No catalog match = no market values; the costs are still there. */
  matched: boolean;
  graders: Array<{
    graderSlug: string;
    graderName: string;
    via: 'run' | 'single';
    runId: string | null;
    rawCents: number | null;
    costCents: number;
    outcomes: Array<{ gradeKey: string; cents: number; gainCents: number | null }>;
    breakEvenGradeKey: string | null;
  }>;
}

export interface ReserveGradingSlotBody {
  inventoryItemId?: string | null;
  /** Required when no inventoryItemId is given. */
  title?: string | null;
  /** What the card is worth, in cents. Some tiers cap it. */
  declaredValueCents: number;
  /** A person checks centering and surface first, for a fee. */
  prescreen?: boolean;
  missMode?: GradingMissMode;
  returnMode?: GradingReturnMode;
}

export interface CreateDirectGradingBody {
  graderSlug: string;
  tierSlug?: string | null;
  inventoryItemId?: string | null;
  title?: string | null;
  /** What the card is worth, in cents. */
  declaredValueCents: number;
}

export interface DirectGradingResultBody {
  /** As the grader writes it: '10', '9.8', 'MS-65'. */
  grade: string;
  qualifier?: string | null;
  sealGrade?: string | null;
  certNumber?: string | null;
}

export type CertLookup =
  | { found: false }
  | { found: true; [key: string]: unknown };

export class GradingResource {
  constructor(private http: HttpClient) {}

  /** Runs taking reservations now. `meta.open` is false while runs are switched off. */
  listRuns() {
    return this.http.request<{ data: GradingRun[]; meta?: { open?: boolean } }>({ method: 'GET', path: '/v1/grading/runs' });
  }

  /** Every grader and tier Crossly can send to. */
  rateCard() {
    return this.http.request<{ data: GradingRate[] }>({ method: 'GET', path: '/v1/grading/rate-card' });
  }

  /** Your cards out for grading, newest first. `active: true` keeps only those in flight. */
  listSubmissions(params: { active?: boolean } = {}) {
    const query = params.active == null ? {} : { active: params.active ? '1' : '0' };
    return this.http.request<{ data: GradingSubmission[] }>({ method: 'GET', path: '/v1/grading/submissions', query });
  }

  /** Worth grading? Raw value vs each grade's value at each grader, against the cost. */
  worth(inventoryItemId: string) {
    return this.http.request<{ worth: GradingWorth }>({ method: 'GET', path: `/v1/grading/worth/${encodeURIComponent(inventoryItemId)}` });
  }

  /**
   * Hold a slot in a run. Charged only if the run locks. Needs a full-access
   * token, and an idempotencyKey derived from the card (reuse it on retries).
   */
  reserve(runId: string, body: ReserveGradingSlotBody, opts: IdempotencyOpts = {}) {
    return this.http.request<{ id: string }>({ method: 'POST', path: `/v1/grading/runs/${encodeURIComponent(runId)}/reserve`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Pull a reserved card out of its run. Only while it is still reserved. */
  cancel(submissionId: string) {
    return this.http.request<{ ok: boolean }>({ method: 'POST', path: `/v1/grading/submissions/${encodeURIComponent(submissionId)}/cancel` });
  }

  /** You mailed a charged card to the hub. */
  markShipped(submissionId: string, body: { tracking?: string | null } = {}) {
    return this.http.request<{ ok: boolean }>({ method: 'POST', path: `/v1/grading/submissions/${encodeURIComponent(submissionId)}/shipped`, body });
  }

  /** Track a card sent on your own grader account. */
  createDirect(body: CreateDirectGradingBody, opts: IdempotencyOpts = {}) {
    return this.http.request<{ id: string }>({ method: 'POST', path: '/v1/grading/direct', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Direct only: enter the grade that came back. */
  recordResult(submissionId: string, body: DirectGradingResultBody) {
    return this.http.request<{ submission: GradingSubmission }>({ method: 'POST', path: `/v1/grading/submissions/${encodeURIComponent(submissionId)}/result`, body });
  }

  /** Look a cert number up with its grader. */
  verifyCert(body: { graderSlug: string; certNumber: string }) {
    return this.http.request<CertLookup>({ method: 'POST', path: '/v1/grading/verify-cert', body });
  }
}
