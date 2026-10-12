import type { HttpClient } from './_shared.js';

// ─── Vault Markets portfolio margin (ECP firm accounts) ─────────────────────
//
// `client.vaultMarkets.portfolioMargin`. The requirement is the worst loss
// across a scenario grid on Crossly marks: each item moves by its tier range
// (deep 15%, standard 20%, thin 35%) in 7 steps, category indexes are shocked
// 30% both ways by beta, CBX 50%, plus a liquidity add-on; never under 15% of
// gross. Same-item long and short net fully, same category 50%, partner index
// futures up to 70%. Firm sub-accounts only. Money fields are integer CENTS
// of US dollars.

export type PmStateName = 'healthy' | 'call' | 'buy_in';
export type PmAccountStatus = 'active' | 'suspended' | 'closed';

export interface PmEligibility {
  eligible: boolean;
  minEquityCents: number;
  /** Every reason it is not eligible, in plain words. */
  reasons: string[];
}

export interface PmCategoryLine {
  category: string;
  name: string;
  keys: number;
  gridLossCents: number;
  gridWorstStep: number;
  shockLossCents: number;
  shockWorstBps: number;
  hedgeOffsetCents: number;
  requirementCents: number;
  binding: 'grid' | 'shock';
}

export interface PmKeyLine {
  bookKey: string;
  title: string;
  category: string | null;
  tier: 'deep' | 'standard' | 'thin';
  netUnits: number;
  markCents: number;
  netCents: number;
  grossCents: number;
  beta: number | null;
  standaloneCents: number;
  liquidityCents: number;
}

export interface PmHedgeLine {
  partner: string;
  indexSlug: string;
  category: string;
  notionalCents: number;
  beta: number;
  asOf: string;
}

export interface PmBreakdown {
  scenarioCents: number;
  floorCents: number;
  binding: 'scenarios' | 'floor';
  grossCents: number;
  netCents: number;
  components: { categoriesCents: number; cbxCents: number; liquidityCents: number };
  byCategory: PmCategoryLine[];
  topKeys: PmKeyLine[];
  cash: { usdCents: number; cbxValueCents: number };
  hedges: PmHedgeLine[];
  unmarkedKeys: string[];
}

export interface PmCurrent {
  equityCents: number | null;
  requirementCents: number | null;
  excessCents: number | null;
  floorCents: number | null;
  grossCents: number | null;
  state: PmStateName | null;
  calledAt: string | null;
  callDeadline: string | null;
  positionsToAuction: string[];
  breakdown: PmBreakdown | null;
  computedAt: string | null;
  /** Older than 15 minutes: per-position margin applies until the next pass. */
  stale: boolean;
}

export interface PmPreview {
  equityCents: number;
  requirementCents: number;
  excessCents: number;
  breakdown: PmBreakdown;
}

export interface PmView {
  account: { accountId: string; kind: 'individual' | 'subaccount'; label: string; subaccountId: string | null; entityId: string | null };
  gate: { open: boolean; missing: string[] };
  label: string;
  policy: string[];
  canManage: boolean;
  enrolled: boolean;
  status: PmAccountStatus | null;
  statusReason: string | null;
  enrolledAt?: string;
  monitoringEvidencedAt?: string | null;
  eligibility: PmEligibility;
  preview: PmPreview | null;
  current: PmCurrent | null;
}

export interface PmRun {
  computedAt: string;
  equityCents: number;
  requirementCents: number;
  excessCents: number;
  scenarioCents: number;
  floorCents: number;
  grossCents: number;
  state: PmStateName;
}

export interface PmRunList {
  data: PmRun[];
}

export interface PmWhatIfInput {
  subaccountId: string;
  bookKey: string;
  side: 'buy' | 'sell';
  units: number;
}

export interface PmWhatIfResult {
  bookKey: string;
  side: 'buy' | 'sell';
  units: number;
  markCents: number;
  before: { requirementCents: number; equityCents: number; excessCents: number };
  after: { requirementCents: number; equityCents: number; excessCents: number };
  changeCents: number;
  note: string;
}

export class VaultMarketsPmResource {
  constructor(private http: HttpClient) {}

  /** Portfolio margin for a firm sub-account: eligibility, requirement, state, breakdown, policy. */
  get(subaccountId: string) {
    return this.http.request<PmView>({ method: 'GET', path: '/v1/vault-markets/portfolio-margin', query: { subaccountId } });
  }

  /** The 5-minute recalculations over the last `hours` (default 24). */
  history(subaccountId: string, hours?: number) {
    return this.http.request<PmRunList>({ method: 'GET', path: '/v1/vault-markets/portfolio-margin/history', query: { subaccountId, hours } });
  }

  /** Admin: put a firm sub-account under portfolio margin. */
  enroll(subaccountId: string) {
    return this.http.request<PmView>({ method: 'POST', path: '/v1/vault-markets/portfolio-margin/enroll', body: { subaccountId } });
  }

  /** Admin: back to per-position margin. */
  leave(subaccountId: string) {
    return this.http.request<PmView>({ method: 'POST', path: '/v1/vault-markets/portfolio-margin/leave', body: { subaccountId } });
  }

  /** The requirement before and after a trade, at the mark. Changes nothing. */
  whatIf(input: PmWhatIfInput) {
    return this.http.request<PmWhatIfResult>({ method: 'POST', path: '/v1/vault-markets/portfolio-margin/what-if', body: input });
  }
}
