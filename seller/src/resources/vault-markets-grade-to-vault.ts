import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Vault Markets: Grade -> Vault -> List on Crossly, and unit evidence ────
//
// `client.vaultMarkets.gradeToVault`. Pick one raw card (an inventory item
// matched to a catalogue item, or a raw vault unit on the grading hub's
// shelf), book it into a Grading Run returning to the vault, and once it is
// graded and stored, CONFIRM a price: only that confirmation places a shelf
// ask on the Crossly order book. Each step is kept, so a flow resumes where it
// stopped. The grading slot is free; your saved card is charged only if the
// run locks. Money fields are integer CENTS of US dollars.
//
// A unit's evidence is its 3D scan (model, texture, listing photos) and its
// Crossly Grading report (grader, grade, cert, verified against the grader's
// record, the hub's intake photos), linked when the unit came in.

export type GradeToVaultSource = 'inventory' | 'vault_unit';
export type GradeToVaultStep = 'picked' | 'grading' | 'in_vault' | 'listed' | 'ended';
export type GradeToVaultNextAction = 'book' | 'ship_to_hub' | 'wait_for_grade' | 'confirm_price' | 'none';
export type GradeToVaultMissMode = 'roll_over' | 'release';
export type UnitEvidenceSource = 'grade_to_vault' | 'vault_grading' | 'grading_return' | 'deposit' | 'owner' | 'ops';

export interface GradeToVaultSubmission {
  status: string;
  graderSlug: string;
  graderName: string;
  tierSlug: string | null;
  inboundLabelUrl: string | null;
  inboundTracking: string | null;
  chargedCents: number;
  runCutoffAt: string | null;
}

export interface GradeToVaultFlow {
  id: string;
  source: GradeToVaultSource;
  step: GradeToVaultStep;
  stepLabel: string;
  nextAction: GradeToVaultNextAction;
  title: string | null;
  imageUrl: string | null;
  inventoryItemId: string | null;
  vaultItemId: string | null;
  submissionId: string | null;
  runId: string | null;
  declaredValueCents: number | null;
  /** The price you had in mind. Never placed without a confirmation. */
  targetPriceCents: number | null;
  prescreen: boolean;
  missMode: string;
  submission: GradeToVaultSubmission | null;
  unit: { id: string; status: string; gradeKey: string | null; bookKey: string | null } | null;
  gradeKey: string | null;
  /** From the book only, while waiting for your price. */
  market: { markCents: number | null; bestBidCents: number | null; notes: string[] } | null;
  ask: { id: string; priceCents: number; status: string } | null;
  listedPriceCents: number | null;
  priceConfirmedAt: string | null;
  endReason: string | null;
  endReasonText: string | null;
  lastError: string | null;
  evidence: { scans: number; grades: number; verifiedGrade: boolean } | null;
  gates: { gradingRuns: { open: boolean; missing: string[] } };
  createdAt: string;
  updatedAt: string;
}

export interface GradeToVaultFlowList {
  data: GradeToVaultFlow[];
}

export interface GradeToVaultCandidate {
  id: string;
  title: string | null;
  imageUrl: string | null;
  variantId: string;
}

export interface GradeToVaultCandidates {
  inventory: GradeToVaultCandidate[];
  vaultUnits: GradeToVaultCandidate[];
  gates: { gradingRuns: { open: boolean; missing: string[] } };
}

export interface StartGradeToVaultBody {
  source: GradeToVaultSource;
  /** Required when `source` is "inventory". */
  inventoryItemId?: string;
  /** Required when `source` is "vault_unit". */
  vaultItemId?: string;
  /** Book the slot at once in this Grading Run. */
  runId?: string;
  /** What it is worth, in cents (the grader's tier limit and insurance). Required to book an inventory card. */
  declaredValueCents?: number;
  /** The price you have in mind, in cents. Shown again after the grade; never placed on its own. */
  targetPriceCents?: number;
  prescreen?: boolean;
  missMode?: GradeToVaultMissMode;
}

export interface BookGradeToVaultBody {
  runId: string;
  declaredValueCents?: number;
  prescreen?: boolean;
  missMode?: GradeToVaultMissMode;
}

export interface ConfirmGradeToVaultListBody {
  /** Your ask, in cents. */
  priceCents: number;
  /** The grade the unit came back with (flow.gradeKey): the price is confirmed for this grade. */
  gradeKey: string;
  /** Must be true: this is your explicit confirmation. */
  confirm: true;
}

export interface UnitScanEvidence {
  id: string;
  captureId: string;
  source: UnitEvidenceSource;
  atIntake: boolean;
  capturedAt: string | null;
  qualityScore: number | null;
  longestEdgeMm: number | null;
  modelUrl: string | null;
  textureUrl: string | null;
  spinUrl: string | null;
  fidelity: string | null;
  render: 'captured_mesh' | 'textured' | 'photos';
  photos: string[];
}

export interface UnitGradeEvidence {
  id: string;
  submissionId: string;
  source: UnitEvidenceSource;
  atIntake: boolean;
  byCrossly: boolean;
  graderSlug: string;
  graderName: string;
  tierSlug: string | null;
  grade: string | null;
  qualifier: string | null;
  sealGrade: string | null;
  certNumber: string | null;
  gradeKey: string | null;
  certVerified: boolean;
  verifiedAt: string | null;
  prescreen: boolean;
  prescreenNote: string | null;
  intakePhotos: string[];
  status: string;
  gradedAt: string | null;
}

export interface UnitEvidence {
  vaultItemId: string;
  scans: UnitScanEvidence[];
  grades: UnitGradeEvidence[];
  model: { kind: 'captured_mesh' | 'textured'; url: string; longestEdgeMm: number | null } | null;
  summary: { scans: number; grades: number; verifiedGrade: boolean; atIntake: boolean };
}

export class VaultMarketsGradeToVaultResource {
  constructor(private http: HttpClient) {}

  /** Your flows, newest first; `live` = only those still going. */
  list(live?: boolean) {
    return this.http.request<GradeToVaultFlowList>({ method: 'GET', path: '/v1/vault-markets/grade-to-vault', query: live ? { live: '1' } : undefined });
  }

  /** What you can start the flow on, and whether Grading Runs are open. */
  candidates() {
    return this.http.request<GradeToVaultCandidates>({ method: 'GET', path: '/v1/vault-markets/grade-to-vault/candidates' });
  }

  /** Start the flow on one item (with `runId`, book the slot at once). */
  start(body: StartGradeToVaultBody, opts: IdempotencyOpts = {}) {
    return this.http.request<GradeToVaultFlow>({ method: 'POST', path: '/v1/vault-markets/grade-to-vault', body, idempotencyKey: opts.idempotencyKey });
  }

  /** One flow, brought up to date. */
  get(id: string) {
    return this.http.request<GradeToVaultFlow>({ method: 'GET', path: `/v1/vault-markets/grade-to-vault/${encodeURIComponent(id)}` });
  }

  /** Book (or re-book) the grading slot of a flow still at "picked". */
  book(id: string, body: BookGradeToVaultBody, opts: IdempotencyOpts = {}) {
    return this.http.request<GradeToVaultFlow>({ method: 'POST', path: `/v1/vault-markets/grade-to-vault/${encodeURIComponent(id)}/book`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** You mailed the card to the grading hub. */
  shipped(id: string, tracking?: string | null, opts: IdempotencyOpts = {}) {
    return this.http.request<GradeToVaultFlow>({ method: 'POST', path: `/v1/vault-markets/grade-to-vault/${encodeURIComponent(id)}/shipped`, body: { tracking: tracking ?? null }, idempotencyKey: opts.idempotencyKey });
  }

  /** Confirm your price for the grade the unit has: one shelf ask goes on the order book. */
  confirmAndList(id: string, body: ConfirmGradeToVaultListBody, opts: IdempotencyOpts = {}) {
    return this.http.request<GradeToVaultFlow>({ method: 'POST', path: `/v1/vault-markets/grade-to-vault/${encodeURIComponent(id)}/list`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Keep the graded unit in your vault without listing it. */
  keep(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<GradeToVaultFlow>({ method: 'POST', path: `/v1/vault-markets/grade-to-vault/${encodeURIComponent(id)}/keep`, idempotencyKey: opts.idempotencyKey });
  }

  /** Stop before the card goes to the grader (nothing charged). */
  cancel(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<GradeToVaultFlow>({ method: 'POST', path: `/v1/vault-markets/grade-to-vault/${encodeURIComponent(id)}/cancel`, idempotencyKey: opts.idempotencyKey });
  }

  /** A vault unit's scans and grade report (no owner identity). */
  evidence(vaultItemId: string) {
    return this.http.request<UnitEvidence>({ method: 'GET', path: `/v1/vault-markets/units/${encodeURIComponent(vaultItemId)}/evidence` });
  }

  /** Add a finished scan of your own (same catalogue item) to your vault unit. */
  addScan(vaultItemId: string, captureId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<UnitEvidence>({ method: 'POST', path: `/v1/vault-markets/units/${encodeURIComponent(vaultItemId)}/evidence/scans`, body: { captureId }, idempotencyKey: opts.idempotencyKey });
  }

  /** Take back a scan you added (intake evidence stays). */
  removeScan(vaultItemId: string, evidenceId: string) {
    return this.http.request<UnitEvidence>({ method: 'DELETE', path: `/v1/vault-markets/units/${encodeURIComponent(vaultItemId)}/evidence/${encodeURIComponent(evidenceId)}` });
  }
}
