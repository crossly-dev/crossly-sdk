import type { HttpClient } from './_shared.js';

// ─── Hall of Grails loans of vault units ────────────────────────────────────
//
// `client.vaultMarkets.hall`. Lend a unit in your Crossly vault to the Hall
// of Grails in Crossly World: a standing loan of DISPLAY RIGHTS ONLY. The unit
// goes on a plinth, under a brass plate naming you (or "a collector"), in every
// weekly exhibition whose category it fits. It never moves and stays yours to
// list, sell or withdraw. You earn reputation per exhibition it stood in and a
// "Lent to the Hall" badge on its story; there is no cash perk. Opt out at any
// time: a unit on show this week finishes the exhibition first. Reads need
// vault-markets:read, writes world:write.

export type HallVaultCredit = 'name' | 'anonymous';
export type HallVaultLoanStatus = 'active' | 'ending' | 'ended';

export interface HallVaultUpcoming {
  week: number;
  key: string;
  title: string;
  startsAt: string;
  endsAt: string;
  current: boolean;
}

export interface HallVaultBadge {
  label: string;
  detail: string;
  onShowNow: boolean;
  exhibitions: number;
}

export interface HallVaultLoan {
  id: string;
  vaultItemId: string;
  skuId: string;
  name: string;
  imageUrl: string | null;
  grade: string | null;
  credit: HallVaultCredit;
  status: HallVaultLoanStatus;
  endedReason: 'opted_out' | 'unit_left' | null;
  since: string;
  endedAt: string | null;
  onShowNow: boolean;
  /** Set while opted out but still on show: the end of this exhibition. */
  showingUntil: string | null;
  exhibitions: number;
  next: HallVaultUpcoming | null;
  badge: HallVaultBadge | null;
}

export interface HallVaultEligibleUnit {
  vaultItemId: string;
  skuId: string;
  name: string;
  imageUrl: string | null;
  grade: string | null;
  canLend: boolean;
  /** Why it cannot be lent now, in words. */
  blocker: string | null;
  next: HallVaultUpcoming | null;
}

export interface HallVaultDesk {
  exhibition: { key: string; title: string; categorySlug: string; endsAt: string; next: string };
  rules: { maxLive: number; shownPerHolder: number; repPoints: number; text: string };
  reputation: { exhibitionsFinished: number; pointsEach: number };
  loans: HallVaultLoan[];
  eligible: HallVaultEligibleUnit[];
}

export interface HallVaultLender {
  skuId: string;
  name: string;
  imageUrl: string;
  grade: string | null;
  lender: string;
  plate: string[];
  exhibitions: number;
}

export interface HallVaultLenderList {
  data: HallVaultLender[];
  meta?: { exhibition: { key: string; title: string; endsAt: string } };
}

export interface HallVaultLendInput {
  vaultItemId: string;
  credit?: HallVaultCredit;
}

export interface HallVaultLendResult {
  id: string;
  status: 'active';
  resumed: boolean;
  next: HallVaultUpcoming | null;
}

export interface HallVaultOptOutResult {
  id: string;
  status: 'ending' | 'ended';
  showingUntil: string | null;
}

export interface HallVaultCreditResult {
  id: string;
  credit: HallVaultCredit;
}

export class VaultMarketsHallResource {
  constructor(private http: HttpClient) {}

  /** This week's lent units on show and the plates that name their lenders. */
  lenders() {
    return this.http.request<HallVaultLenderList>({ method: 'GET', path: '/v1/vault-markets/hall/lenders' });
  }

  /** Your Hall desk: your loans, the units you could lend, what lending earned. */
  desk() {
    return this.http.request<HallVaultDesk>({ method: 'GET', path: '/v1/vault-markets/hall/loans' });
  }

  /** Lend a vault unit to the Hall (display rights only; world:write). */
  lend(body: HallVaultLendInput) {
    return this.http.request<HallVaultLendResult>({ method: 'POST', path: '/v1/vault-markets/hall/loans', body });
  }

  /** Opt a loan out (a unit on show finishes this exhibition; world:write). */
  optOut(id: string) {
    return this.http.request<HallVaultOptOutResult>({ method: 'POST', path: `/v1/vault-markets/hall/loans/${encodeURIComponent(id)}/opt-out` });
  }

  /** How the plate names you: your name, or "a collector" (world:write). */
  setCredit(id: string, credit: HallVaultCredit) {
    return this.http.request<HallVaultCreditResult>({ method: 'POST', path: `/v1/vault-markets/hall/loans/${encodeURIComponent(id)}/credit`, body: { credit } });
  }
}
