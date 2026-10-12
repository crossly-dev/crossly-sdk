import type { HttpClient } from './_shared.js';

// ─── The unit story ─────────────────────────────────────────────────────
//
// `client.vaultMarkets.unitStory`. One timeline per vault unit, oldest first:
// intake (with scan and grade evidence when it has some), grades, owners,
// sales at their prices, loans, pledges, Hall of Grails exhibitions,
// receipt-token exports and redemptions, and every warehouse-receipt
// hash-chain step, re-verified on read (`chain.ok`). Its holder sees all of
// it; anyone else only while the holder's public vault profile is on (else
// 404). People are named only while their own public profile is on; the rest
// are "A collector", and you are "You". Money is integer CENTS of US dollars;
// only a sale carries one.

export type UnitStoryKind =
  | 'sent_in' | 'received' | 'vaulted_from_grading' | 'bought_in' | 'evidence'
  | 'grading_sent' | 'graded' | 'grading_returned'
  | 'sale' | 'transfer'
  | 'lent' | 'recalled' | 'loan_returned' | 'pledged' | 'released' | 'foreclosed' | 'hall_on_show' | 'hall_ended'
  | 'token_exported' | 'token_redeemed'
  | 'shipped_out'
  | 'receipt';

export type UnitStoryGroup = 'intake' | 'grade' | 'owner' | 'loan' | 'hall' | 'token' | 'receipt' | 'custody';

export type UnitStoryBadge = 'graded' | 'lent_to_hall' | 'on_loan' | 'pledged' | 'token_out' | 'receipt_verified' | 'left_vault';

export interface UnitStoryPerson {
  label: string;
  handle: string | null;
  profileUrl: string | null;
  you: boolean;
}

export interface UnitStoryChainStep {
  receiptNo: string;
  seq: number;
  status: string;
  holderHash: string;
  prevHash: string;
  hash: string;
}

export interface UnitStoryEvidence {
  kind: string;
  label: string;
  url: string | null;
  previewUrl: string | null;
}

export interface UnitStoryEvent {
  id: string;
  at: string;
  kind: UnitStoryKind;
  group: UnitStoryGroup;
  title: string;
  detail: string | null;
  /** A sale's price in cents; null for everything else. */
  priceCents: number | null;
  from: UnitStoryPerson | null;
  to: UnitStoryPerson | null;
  chain: UnitStoryChainStep | null;
  evidence: UnitStoryEvidence | null;
  /** A page about this event, for the holder only. */
  href: string | null;
}

export interface UnitStoryChainSummary {
  receipts: number;
  events: number;
  ok: boolean;
  broken: { receiptNo: string; seq: number | null } | null;
  receiptNo: string | null;
  head: string | null;
}

export interface UnitStoryUnit {
  id: string;
  title: string | null;
  imageUrl: string | null;
  bookKey: string | null;
  gradeLabel: string | null;
  status: string;
  statusLabel: string;
  shelf: string | null;
  since: string;
  /** The holder's view only. */
  certNo: string | null;
}

export interface UnitStoryView {
  unit: UnitStoryUnit;
  holder: UnitStoryPerson;
  mark: { cents: number | null; quality: 'A' | 'B' | 'C' | 'none'; asOf: string | null };
  viewer: 'holder' | 'public';
  shareable: boolean;
  shareUrl: string;
  badges: UnitStoryBadge[];
  chain: UnitStoryChainSummary | null;
  stats: { owners: number; sales: number; lastSaleCents: number | null; daysInVault: number | null };
  events: UnitStoryEvent[];
  marketHref: string | null;
}

export interface UnitStoryPositionUnit {
  vaultItemId: string;
  title: string | null;
  imageUrl: string | null;
  status: string;
  storyUrl: string;
}

export interface UnitStoryPositionUnitList { data: UnitStoryPositionUnit[] }

export class VaultMarketsUnitStoryResource {
  constructor(private http: HttpClient) {}

  /** One vault unit's story (yours in full; someone else's only while their public vault profile is on). */
  get(vaultItemId: string) {
    return this.http.request<UnitStoryView>({ method: 'GET', path: `/v1/vault-markets/units/${encodeURIComponent(vaultItemId)}/story` });
  }

  /** The units of one of your positions that you hold (a leveraged long's collateral), with story links. */
  positionUnits(positionId: string) {
    return this.http.request<UnitStoryPositionUnitList>({ method: 'GET', path: `/v1/vault-markets/positions/${encodeURIComponent(positionId)}/units` });
  }
}
