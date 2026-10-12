import type { HttpClient } from './_shared.js';

// ─── Grading population reports ─────────────────────────────────────────────
//
// `client.vaultMarkets.popReports`. How many copies of a card a grader has
// graded at each grade, as of the report's date, for one Vault Markets
// market. On a graded market `focus` is that grade: `pop` (copies at exactly
// this grade) and `higher` (copies the same grader graded better). Each
// grader's numbers come from one report: the newest, with the population
// feed's beating a hand entry on the same date. Counts only, never a price.
// Reads need vault-markets:read.

/** provider = the population feed; ops = entered by Crossly from the grader's published report. */
export type VaultPopSource = 'provider' | 'ops';

/**
 * ok          there is a report to show
 * not_synced  the population feed knows this card but has not answered yet
 * no_report   nothing for this card (the feed, if connected, does not cover it)
 * no_source   no population feed is connected and nobody has entered a report
 */
export type VaultPopStatus = 'ok' | 'not_synced' | 'no_report' | 'no_source';

export interface VaultPopGradeRow {
  gradeKey: string;
  /** "PSA 10". */
  grade: string;
  count: number;
  /** Graded better than this grade in the same report. */
  higher: number;
}

export interface VaultPopGrader {
  graderSlug: string;
  graderName: string;
  source: VaultPopSource;
  /** The report's date, YYYY-MM-DD. */
  asOf: string;
  updatedAt: string | null;
  total: number;
  /** Best grade first. */
  grades: VaultPopGradeRow[];
}

export interface VaultPopFocus {
  graderSlug: string;
  graderName: string;
  gradeKey: string;
  grade: string;
  pop: number;
  higher: number;
  total: number;
  asOf: string;
  source: VaultPopSource;
}

export interface VaultPopReport {
  bookKey: string;
  variantId: string;
  /** null on a raw (ungraded) market. */
  gradeKey: string | null;
  /** The market's own grade; null on a raw market or when its grader has no report. */
  focus: VaultPopFocus | null;
  graders: VaultPopGrader[];
  provider: { connected: boolean };
  status: VaultPopStatus;
  /** What is missing, in plain words; null when status is ok. */
  explain: string | null;
}

export class VaultMarketsPopReportsResource {
  constructor(private http: HttpClient) {}

  /** The population report for one market (`variantId:condition:gradeKey`, grade "-" when ungraded). */
  get(bookKey: string) {
    return this.http.request<VaultPopReport>({ method: 'GET', path: '/v1/vault-markets/pop-reports', query: { bookKey } });
  }
}
