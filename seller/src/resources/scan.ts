import type { HttpClient } from './_shared.js';

/**
 * 3D scanning — read only.
 *
 * ── WHY THERE IS NO `startCapture` HERE ──────────────────────────────
 * Frames come from a camera a person is holding, so a programmatic start could
 * not produce them anyway — and it COULD spend the generation budget with
 * nobody present. The write path stays in the apps, where the camera is.
 *
 * What an integration genuinely wants is the bulk question: of these four
 * hundred catalogued items, which already have a model and which are worth
 * capturing? That is `modelsFor`.
 */
export interface ScanCapture {
  id: string;
  /** capturing | uploaded | processing | ready | failed | rejected */
  status: string;
  archetype: string;
  mode: string;
  inventoryItemId: string | null;
  marketSkuId: string | null;
  variantId: string | null;
  /** Percentage of submitted frames that passed the quality gate. */
  qualityScore: number | null;
  /** Why it was refused, in the words the seller was shown. */
  rejectReason: string | null;
  /**
   * Why geometry was not generated, on a capture that otherwise SUCCEEDED.
   *
   * Distinct from `rejectReason`: these captures produced listing photos and a
   * textured model, they just did not reach a GPU. Out of monthly allowance,
   * too few distinct angles to reconstruct from, or you had already had a model
   * built from this object.
   */
  generationSkipped: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ScanModel {
  /** Set when the model belongs to a CATALOGUE product, shared by everyone. */
  variantId: string | null;
  /**
   * Set when the model belongs to one of YOUR inventory rows.
   *
   * An object with no catalogue identity — a lamp, a one-off — is not a
   * product anyone else can claim, so its model is private to that row.
   */
  inventoryItemId: string | null;
  /** Generated geometry. Null when the item is textured onto a known shape. */
  modelUrl: string | null;
  /** The item's real surface on the category's mesh. */
  textureUrl: string | null;
  /** textured | captured */
  fidelity: string;
  /**
   * The item's longest real edge in millimetres, when a capture measured it
   * against something of known size.
   *
   * Null is the ordinary case and means the mesh has correct proportions but no
   * real scale — a renderer should size it from its own layout rather than
   * treating the model's units as metres.
   */
  longestEdgeMm: number | null;
}

export class ScanResource {
  constructor(private http: HttpClient) {}

  /**
   * Your capture sessions, newest first. Requires `listings:read`.
   *
   * A capture that reports `ready` with no mesh is NORMAL: most items are
   * textured onto a shape the category already fixes, which is cheaper and
   * looks the same. Treating "no modelUrl" as a failure would misreport the
   * common case.
   */
  listCaptures(params: { status?: string; limit?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.limit) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return this.http.request<{ data: ScanCapture[] }>({
      method: 'GET',
      path: `/v1/scan/captures${q ? `?${q}` : ''}`,
    });
  }

  /**
   * Which of these already have a 3D model.
   *
   * Ask by catalogue variant, by your own inventory rows, or both. The two are
   * different kinds of answer: a catalogue model is SHARED — a hit means your
   * listing gets it with nothing to capture, because somebody else already paid
   * to generate it — while an inventory model is private to that row.
   *
   * Use it before suggesting a scan: the ids that come back absent are the ones
   * worth capturing.
   */
  modelsFor(input: readonly string[] | { variantIds?: readonly string[]; inventoryItemIds?: readonly string[] }) {
    // An array keeps meaning variant ids, so existing callers are untouched.
    // Annotated rather than cast on one arm: casting inside the ternary leaves
    // the union typed as the FIRST branch's shape, and `inventoryItemIds` then
    // does not exist on it.
    // Both arms cast: Array.isArray does not narrow a `readonly string[]` out of
    // a union — it is typed to narrow to the mutable `any[]` — so the else arm
    // still includes the array and TS rejects the assignment.
    type ModelQuery = { variantIds?: readonly string[]; inventoryItemIds?: readonly string[] };
    const arg: ModelQuery = Array.isArray(input)
      ? { variantIds: input as readonly string[] }
      : (input as ModelQuery);
    const qs = new URLSearchParams();
    if (arg.variantIds?.length) qs.set('variantIds', arg.variantIds.slice(0, 200).join(','));
    if (arg.inventoryItemIds?.length) {
      qs.set('inventoryItemIds', arg.inventoryItemIds.slice(0, 200).join(','));
    }
    return this.http.request<{ data: ScanModel[] }>({
      method: 'GET',
      path: `/v1/scan/models?${qs.toString()}`,
    });
  }
}
