import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Vault Markets large-trader reports ─────────────────────────────────────
//
// `client.vaultMarkets.reports`. A group of linked accounts (one party) over
// 25% of an item's vault units, or $100,000 of it at the mark, files a short
// large-trader report; Crossly ops then review it. Filing never moves money,
// never blocks a trade and never changes a mark. Money fields are integer
// CENTS of US dollars.

export type LargeTraderPurpose = 'collecting' | 'investment' | 'resale' | 'market_making' | 'hedging' | 'other';
export type LargeTraderActingFor = 'self' | 'entity' | 'clients';
/** file = not filed yet; amend = filed, not reviewed; refile = reviewed (a new filing goes back for review); none = cleared. */
export type LargeTraderAction = 'file' | 'amend' | 'refile' | 'none';

export interface LargeTraderFiling {
  purpose: LargeTraderPurpose;
  actingFor: LargeTraderActingFor;
  entityName: string | null;
  otherAccounts: string | null;
  intendsToAdd: boolean;
  statement: string;
}

export interface LargeTraderReport {
  id: string;
  bookKey: string;
  name: string | null;
  label: string | null;
  heldUnits: number;
  sharePct: number;
  /** At the mark, in cents; null without a mark. */
  notionalCents: number | null;
  status: 'required' | 'filed' | 'cleared';
  action: LargeTraderAction;
  filedAt: string | null;
  filedVia: 'self' | 'ops' | null;
  filing: LargeTraderFiling | null;
  reviewedAt: string | null;
  firstFlaggedAt: string;
  lastSeenAt: string;
}

export interface LargeTraderReportList {
  data: LargeTraderReport[];
}

export interface FileLargeTraderReportBody {
  purpose: LargeTraderPurpose;
  actingFor: LargeTraderActingFor;
  /** Required when acting for an entity or clients. */
  entityName?: string | null;
  /** Other Crossly accounts you control or act with. */
  otherAccounts?: string | null;
  intendsToAdd?: boolean | null;
  /** A few sentences about the position, 20 to 4,000 characters. */
  statement: string;
}

const id = (s: string) => encodeURIComponent(s);

export class VaultMarketsReportsResource {
  constructor(private http: HttpClient) {}

  /** Your large-trader reports: due first, then filed, then cleared in the last 90 days. */
  largeTraderReports() {
    return this.http.request<LargeTraderReportList>({ method: 'GET', path: '/v1/vault-markets/large-trader-reports' });
  }

  /** File, amend or refile a large-trader report. */
  fileLargeTraderReport(reportId: string, body: FileLargeTraderReportBody, opts: IdempotencyOpts = {}) {
    return this.http.request<LargeTraderReport>({ method: 'POST', path: `/v1/vault-markets/large-trader-reports/${id(reportId)}/file`, body, idempotencyKey: opts.idempotencyKey });
  }
}
