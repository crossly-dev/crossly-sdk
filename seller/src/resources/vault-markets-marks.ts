import type { HttpClient } from './_shared.js';
import type { VaultMarkQuality } from './vault-markets-channels.js';

// ─── Vault Markets: one mark with everything behind it ──────────────────────
//
// `client.vaultMarkets.marks`. A mark comes from the Crossly order book only.
// Its quality says how far it can be trusted (A trade-anchored, B firm
// two-sided mid, C indicative, none), its confidence is a ± band, and a
// mark that took an implied input names it (a related grade, the model median
// of the other sizes, or an index); an implied input never makes a mark
// usable for risk. Money fields are integer CENTS of US dollars.

export interface VaultMarkImpliedFrom {
  /** The related book key, `model:<sku>:<condition>:<grade>` for the model median, or `index:<slug>`. */
  relatedKey: string;
  /** "grade", "size" or "index". */
  relation: string;
  label: string | null;
  ratio: number;
  impliedCents: number;
}

export interface VaultMarkBand {
  lowCents: number;
  highCents: number;
}

export interface VaultMarkRelation {
  relatedKey: string;
  relation: string;
  label: string | null;
  /** Learned key / related ratio. */
  ratio: number;
  /** Robust scale of the log ratio. */
  logScale: number;
  pairDays: number;
  effectiveDays: number;
  learnedAt: string;
}

export interface VaultMarkDetail {
  bookKey: string;
  cents: number | null;
  quality: VaultMarkQuality;
  confidenceBps: number | null;
  band: VaultMarkBand | null;
  asOf: string | null;
  source: string;
  seasoned: boolean;
  /** Judged for margin: whether risk may act on this mark. */
  usableForRisk: boolean;
  ltvAllowed: boolean;
  impliedFrom: VaultMarkImpliedFrom | null;
  methodVersion: number | null;
  day: string | null;
  /** Every stored input behind the mark (trades, firm book, the filter, implied parts). */
  inputs: unknown;
  related: VaultMarkRelation[];
}

export class VaultMarketsMarksResource {
  constructor(private http: HttpClient) {}

  /** One book key's mark (`variantId:condition:gradeKey`, grade "-" when ungraded) with its inputs and confidence. */
  get(bookKey: string) {
    return this.http.request<VaultMarkDetail>({ method: 'GET', path: `/v1/vault-markets/marks/${encodeURIComponent(bookKey)}` });
  }
}
