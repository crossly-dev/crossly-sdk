import type { HttpClient } from './_shared.js';

// ─── Joint vaults and transfer-on-death ─────────────────────────────────────
//
// `client.vaultMarkets.jointTod`. A joint vault is shared view and trading
// rights over units its ID-checked members put in: each unit keeps its owner
// of record and never leaves the custodian shelf. Rights are view, trade or
// full; each trade is placed by the member who starts it, under that member,
// through the normal order path (a buy is paid from their own account and
// booked to the joint vault; a sell sits on the unit owner of record). Every
// action is in the audit trail.
//
// Transfer-on-death names who receives your vault units: shares, plus
// specific units to specific people. A beneficiary claims with documents and
// their own ID; ops review the documents, a 30-day wait runs (you are told and
// can stop it), and the units then move vault to vault. Nothing here moves
// money. Each half answers 503 naming VAULT_JOINT_TERMS_VERSION or
// VAULT_TOD_TERMS_VERSION until counsel's terms are set. Reads need
// vault-markets:read, writes vault-markets:trade.

export type JointRights = 'view' | 'trade' | 'full';
export type JointVaultStatus = 'pending' | 'active' | 'closed';
export type TodClaimStatus = 'draft' | 'submitted' | 'needs_info' | 'waiting' | 'released' | 'partly_released' | 'rejected' | 'objected' | 'withdrawn';
export type TodDocKind = 'death_certificate' | 'letters' | 'will' | 'id_document' | 'other';

export interface JointGate {
  open: boolean;
  missing: string[];
  termsVersion: string | null;
  terms: string[];
  rights: Record<JointRights, string>;
  limits: { maxMembers: number; minActive: number; inviteDays: number; maxUnits: number };
}

export interface JointVaultSummary { id: string; name: string; status: JointVaultStatus; rights: JointRights; members: number; units: number; termsCurrent: boolean; href: string }
export interface JointInvitation { id: string; name: string; rights: JointRights; invitedBy: string; expiresAt: string | null; members: number }
export interface JointVaultsHome { gate: JointGate; vaults: JointVaultSummary[]; invitations: JointInvitation[] }

export interface JointMember { userId: string; name: string; rights: JointRights; status: 'active' | 'invited'; joinedAt: string | null; expiresAt: string | null }
export interface JointUnit {
  vaultItemId: string; name: string; imageUrl: string | null; grade: string | null; condition: string; bookKey: string | null;
  ownerUserId: string; ownerName: string; mine: boolean; onBook: boolean;
  /** The book mark in cents of US dollars, or null when the key has none. */
  markCents: number | null;
  valueCents: number;
  valueSource: 'mark' | 'insured' | 'declared' | 'none';
}
export interface JointTrade {
  id: string; side: 'buy' | 'sell'; bookKey: string; quantity: number; limitCents: number; status: 'placing' | 'placed' | 'refused';
  refuseReason: string | null; orderId: string | null; orderStatus: string | null; filledQuantity: number; avgFillCents: number | null;
  initiatorUserId: string; ownerUserId: string; createdAt: string; initiatorName?: string; ownerName?: string;
}
export interface JointTradeList { data: JointTrade[] }
export interface JointActivity { seq: number; at: string; kind: string; what: string; by: string; source: string }
export interface JointVaultDetail {
  gate: JointGate; id: string; name: string; status: JointVaultStatus; createdAt: string;
  me: { rights: JointRights; termsCurrent: boolean; canTrade: boolean; canManage: boolean };
  members: JointMember[];
  units: JointUnit[];
  totals: { units: number; valueCents: number; unpriced: number };
  trades: JointTrade[];
  eligible: Array<{ vaultItemId: string; name: string; imageUrl: string | null; grade: string | null }>;
  activity: JointActivity[];
}

export interface JointCreateInput { name: string; invite?: Array<{ to: string; rights?: JointRights }> }
export interface JointCreated { id: string; status: JointVaultStatus; invited: Array<{ to: string; ok: boolean; error: string | null }> }
export interface JointInvited { userId: string; rights: JointRights; expiresAt: string }
export interface JointStatusResult { status: string }
export interface JointTermsResult { termsVersion: string }
export interface JointRightsResult { userId: string; rights: JointRights }
export interface JointMemberRemoved { userId: string; status: 'left' | 'removed'; unitsReturned: number; jointStatus: string }
export interface JointUnitsAdded { added: number; vaultItemIds: string[] }
export interface JointUnitsRemoved { removed: number; vaultItemIds: string[] }
export interface JointClosed { status: 'closed'; unitsReturned: number }

export type JointTradeInput =
  | { side: 'buy'; bookKey: string; quantity?: number; limitCents: number; tif?: 'day' | 'gtc' | 'ioc'; clientOrderId?: string }
  | { side: 'sell'; vaultItemId: string; quantity?: number; limitCents: number; tif?: 'day' | 'gtc' | 'ioc'; clientOrderId?: string };
export interface JointTradePlaced { tradeId: string; side: 'buy' | 'sell'; bookKey: string; ownerUserId: string; order: { id: string; status: string } & Record<string, unknown> }
export interface JointTradeCancelled { tradeId: string; order: { id: string; status: string } & Record<string, unknown> }

export interface TodGate { open: boolean; missing: string[]; termsVersion: string | null; terms: string[]; waitDays: number; maxBeneficiaries: number }
export interface TodBeneficiary { id: string; fullName: string; email: string; relationship: string | null; shareBps: number; hasAccount: boolean; units: number; valueCents: number }
export interface TodUnit { vaultItemId: string; name: string; imageUrl: string | null; grade: string | null; status: string; markCents: number | null; valueCents: number; designatedTo: string | null; plannedFor: string | null }
export interface TodHolderClaim { id: string; status: TodClaimStatus; label: string; beneficiaryName: string; createdAt: string; submittedAt: string | null; waitEndsAt: string | null }
export interface TodOverview {
  gate: TodGate; accepted: boolean; acceptedVersion: string | null; acceptedAt: string | null; locked: boolean;
  beneficiaries: TodBeneficiary[]; sharesProblem: string | null; units: TodUnit[]; claims: TodHolderClaim[];
}
export interface TodBeneficiaryInput {
  /** Keep an existing beneficiary id to edit it in place. */
  id?: string;
  fullName: string;
  /** Their email, or @username of a Crossly account. */
  contact: string;
  relationship?: string | null;
  /** Share of the undesignated units, basis points; the list adds up to 10000. */
  shareBps: number;
}
export interface TodBeneficiariesSet { beneficiaries: number; removed: number }
export interface TodDesignationSet { vaultItemId: string; beneficiaryId: string | null }
export interface TodObjected { id: string; status: 'objected'; estateUnlocked: boolean }

export interface TodClaimDocument { id: string; kind: TodDocKind; label: string; filename: string; bytes: number; at: string }
export interface TodMyClaim {
  id: string; status: TodClaimStatus; label: string; holderName: string; editable: boolean; opsNote: string | null; rejectReason: string | null;
  createdAt: string; submittedAt: string | null; waitEndsAt: string | null; releasedAt: string | null; documents: TodClaimDocument[];
  moved: number; held: number; planned: { units: number; valueCents: number } | null;
}
export interface TodMyClaims { gate: TodGate; docKinds: Array<{ kind: TodDocKind; label: string }>; claims: TodMyClaim[] }
export interface TodClaimCreateInput { holder: string; note?: string | null }
export interface TodClaimCreated { id: string; status: string; existing: boolean }
export interface TodClaimDocInput { kind: TodDocKind; filename: string; /** The file as base64: PDF, JPEG or PNG, up to 8 MB. */ dataBase64: string }
export interface TodClaimDocAdded { id: string; kind: TodDocKind; label: string; filename: string; bytes: number }
export interface TodClaimStatusResult { id: string; status: TodClaimStatus }

export class VaultMarketsJointTodResource {
  constructor(private http: HttpClient) {}

  /* ── Joint vaults ──────────────────────────────────────────────── */

  /** Your joint vaults, invitations, the gate and the terms. */
  joint() {
    return this.http.request<JointVaultsHome>({ method: 'GET', path: '/v1/vault-markets/joint' });
  }

  /** Open a joint vault (ID first); invitations optional. */
  createJoint(input: JointCreateInput) {
    return this.http.request<JointCreated>({ method: 'POST', path: '/v1/vault-markets/joint', body: input });
  }

  /** One joint vault as its members see it. */
  getJoint(id: string) {
    return this.http.request<JointVaultDetail>({ method: 'GET', path: `/v1/vault-markets/joint/${encodeURIComponent(id)}` });
  }

  /** Invite a Crossly user (full rights only). */
  invite(id: string, to: string, rights: JointRights = 'view') {
    return this.http.request<JointInvited>({ method: 'POST', path: `/v1/vault-markets/joint/${encodeURIComponent(id)}/invite`, body: { to, rights } });
  }

  /** Accept (ID first) or decline an invitation. */
  respond(id: string, action: 'accept' | 'decline') {
    return this.http.request<JointStatusResult>({ method: 'POST', path: `/v1/vault-markets/joint/${encodeURIComponent(id)}/respond`, body: { action } });
  }

  /** Accept the current joint terms. */
  acceptJointTerms(id: string) {
    return this.http.request<JointTermsResult>({ method: 'POST', path: `/v1/vault-markets/joint/${encodeURIComponent(id)}/terms` });
  }

  /** Set a member rights (full rights only). */
  setRights(id: string, userId: string, rights: JointRights) {
    return this.http.request<JointRightsResult>({ method: 'POST', path: `/v1/vault-markets/joint/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}/rights`, body: { rights } });
  }

  /** Remove a member (full rights), or leave when userId is you. */
  removeMember(id: string, userId: string) {
    return this.http.request<JointMemberRemoved>({ method: 'POST', path: `/v1/vault-markets/joint/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}/remove` });
  }

  /** Put units you own into the joint vault. */
  addUnits(id: string, vaultItemIds: string[]) {
    return this.http.request<JointUnitsAdded>({ method: 'POST', path: `/v1/vault-markets/joint/${encodeURIComponent(id)}/units`, body: { vaultItemIds } });
  }

  /** Take units out, back to their owner own account. */
  removeUnits(id: string, vaultItemIds: string[]) {
    return this.http.request<JointUnitsRemoved>({ method: 'POST', path: `/v1/vault-markets/joint/${encodeURIComponent(id)}/units/remove`, body: { vaultItemIds } });
  }

  /** The joint vault trades, newest first. */
  trades(id: string, limit?: number) {
    return this.http.request<JointTradeList>({ method: 'GET', path: `/v1/vault-markets/joint/${encodeURIComponent(id)}/trades`, query: limit ? { limit } : undefined });
  }

  /** Place a limit order for the joint vault (trade or full rights). */
  trade(id: string, input: JointTradeInput) {
    return this.http.request<JointTradePlaced>({ method: 'POST', path: `/v1/vault-markets/joint/${encodeURIComponent(id)}/trades`, body: input });
  }

  /** Cancel a working joint order. */
  cancelTrade(id: string, tradeId: string) {
    return this.http.request<JointTradeCancelled>({ method: 'POST', path: `/v1/vault-markets/joint/${encodeURIComponent(id)}/trades/${encodeURIComponent(tradeId)}/cancel` });
  }

  /** Close the joint vault (full rights). */
  close(id: string) {
    return this.http.request<JointClosed>({ method: 'POST', path: `/v1/vault-markets/joint/${encodeURIComponent(id)}/close` });
  }

  /* ── Transfer-on-death ─────────────────────────────────────────── */

  /** Your transfer-on-death setup and the claims on your account. */
  tod() {
    return this.http.request<TodOverview>({ method: 'GET', path: '/v1/vault-markets/tod' });
  }

  /** Accept the current transfer-on-death terms. */
  acceptTodTerms() {
    return this.http.request<JointTermsResult>({ method: 'POST', path: '/v1/vault-markets/tod/terms' });
  }

  /** Replace your beneficiary list (shares add up to 10000 bps). */
  setBeneficiaries(beneficiaries: TodBeneficiaryInput[]) {
    return this.http.request<TodBeneficiariesSet>({ method: 'PUT', path: '/v1/vault-markets/tod/beneficiaries', body: { beneficiaries } });
  }

  /** Leave one unit to one beneficiary (null clears it). */
  designate(vaultItemId: string, beneficiaryId: string | null) {
    return this.http.request<TodDesignationSet>({ method: 'PUT', path: '/v1/vault-markets/tod/designations', body: { vaultItemId, beneficiaryId } });
  }

  /** Stop a claim made on your own account. */
  objectToClaim(claimId: string) {
    return this.http.request<TodObjected>({ method: 'POST', path: `/v1/vault-markets/tod/claims/${encodeURIComponent(claimId)}/object` });
  }

  /** Claims you filed as a beneficiary. */
  myClaims() {
    return this.http.request<TodMyClaims>({ method: 'GET', path: '/v1/vault-markets/tod/my-claims' });
  }

  /** Start a claim (ID first). */
  fileClaim(input: TodClaimCreateInput) {
    return this.http.request<TodClaimCreated>({ method: 'POST', path: '/v1/vault-markets/tod/my-claims', body: input });
  }

  /** Add one document to a draft claim. */
  addClaimDocument(claimId: string, input: TodClaimDocInput) {
    return this.http.request<TodClaimDocAdded>({ method: 'POST', path: `/v1/vault-markets/tod/my-claims/${encodeURIComponent(claimId)}/documents`, body: input });
  }

  /** Send a claim for review (needs a death certificate). */
  submitClaim(claimId: string) {
    return this.http.request<TodClaimStatusResult>({ method: 'POST', path: `/v1/vault-markets/tod/my-claims/${encodeURIComponent(claimId)}/submit` });
  }

  /** Withdraw a claim before release. */
  withdrawClaim(claimId: string) {
    return this.http.request<TodClaimStatusResult>({ method: 'POST', path: `/v1/vault-markets/tod/my-claims/${encodeURIComponent(claimId)}/withdraw` });
  }
}
