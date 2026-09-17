import type { HttpClient, JsonObject } from './_shared.js';

/**
 * Attestation verdict for a packing capture.
 *
 * - `attested` — one unbroken take, recorded after the order existed.
 * - `partial`  — genuine and unedited, but with gaps in it.
 * - `unusable` — the chain does not verify, or it arrived faster than it could
 *   have been filmed. Treat as if there were no video.
 */
export type CaptureVerdict = 'attested' | 'partial' | 'unusable';

/**
 * Seal verdict. Note the asymmetry: only a replaced seal reaches `opened`.
 * Drift and creases stop at `suspect`, because parcels get crushed and customs
 * opens boxes lawfully.
 */
export type SealVerdict = 'intact' | 'suspect' | 'opened' | 'unknown';

export type ArrivalState =
  | 'not_requested'
  | 'awaiting'
  | 'submitted'
  | 'declined'
  | 'window_closed';

// ─── Evidence (packing video, seal, arrival photos, serials) ────────────────
//
// Everything recorded about how one order was packed and how it arrived. The
// read a dispute submission is built from.
//
// Absence is reported as absence throughout: an empty section means nothing
// was recorded, never that nothing happened. Do not treat a missing packing
// video as evidence of bad faith, or a missing arrival reading as proof the
// parcel was fine.

export class EvidenceResource {
  constructor(private http: HttpClient) {}

  /**
   * The full evidence bundle for an order: captures + attestation verdicts,
   * the dispatch-vs-arrival seal comparison, arrival-condition state and
   * photos, and the identified units that shipped.
   */
  forOrder(orderId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/orders/${encodeURIComponent(orderId)}/evidence`,
    });
  }
}
