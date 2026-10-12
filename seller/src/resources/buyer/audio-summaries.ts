// ── Audio listing summaries ─────────────────────────────────────────
//
// Composed onto `BuyerResource` as `buyer.audioSummaries`. A spoken summary
// of a listing for accessibility: the text is built only from the listing's
// own fields and the seller's description (never model prose); the recording
// is made once per listing version.

import type { HttpClient } from '../_shared.js';

export interface AudioSummary {
  text: string;
  /** The recording of exactly this text, or null when there is none yet. */
  audioUrl: string | null;
  /** A recording can be made (a speech provider is configured). */
  canGenerate: boolean;
}

/** Audio summaries. Needs `buyer:catalog:read`. */
export class BuyerAudioSummariesResource {
  constructor(private http: HttpClient) {}

  get(slug: string) {
    return this.http.request<{ data: AudioSummary }>({ method: 'GET', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/audio-summary` });
  }

  /** Record it (or return the cached recording of the current text). */
  generate(slug: string) {
    return this.http.request<{ data: AudioSummary }>({ method: 'POST', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/audio-summary` });
  }
}
