import type { HttpClient, IdempotencyOpts, JsonObject } from './_shared.js';

// ─── Vault Markets institutional: entities, NAV, risk, capacity, TCA, statements ─
//
// `client.vaultMarkets.inst`. Entity accounts (a fund, LLC, trust or SPV)
// with members in roles — admin, trader, risk, ops, viewer (a viewer can
// never place an order) — sub-accounts with limits and a firm kill switch.
// KYB is the custodian partner's. Pass `subaccountId` to read a sub-account
// you are a member of; leave it out for your own account.
//
// NAV comes three ways (mark, bid, liquidation), each holding with its ASC 820
// level. VaR and LVaR are MODEL figures: labelled, with their `n` and a
// `band`, and `cents: null` below their data threshold ("Not enough Crossly
// trades"). They never feed margin, loans or settlement. Every money field is
// integer CENTS of US dollars.
//
// PDFs are binary: every SDK call decodes the body as text, so there is no
// PDF method here; `navFile('csv' | 'json')` and `statementFile(.., 'csv' |
// 'json')` return text. Fetch `/v1/vault-markets/nav/file/pdf` or
// `/statements/:month/file/pdf` with your token for the PDF.

export type EntityType = 'lp' | 'llc' | 'corp' | 'trust' | 'spv';
export type EntityRole = 'admin' | 'trader' | 'risk' | 'ops' | 'viewer';

export interface AccountLimitsBody {
  maxOrderNotionalCents?: number | null;
  maxUnitsPerKey?: number | null;
  maxGrossCents?: number | null;
  maxNetCents?: number | null;
  /** 100 = no leverage. */
  maxLeverageX100?: number | null;
}

export interface CreateEntityBody { legalName: string; entityType: EntityType; jurisdiction: string; lei?: string | null; taxClassification?: string | null }
export interface InviteMemberBody { email: string; role: EntityRole; limits?: AccountLimitsBody | null; subaccountIds?: string[] | null }
export interface AdminMarksBody { subaccountId?: string | null; administrator: string; marks: Array<{ bookKey: string; day: string; cents: number }> }
export interface WindowParams { subaccountId?: string; from?: string; to?: string; limit?: number }

export interface BlockPlanLine { subaccountId: string; quantity: number }

/** A block buy: `order` is a pro order body (buy only; it is paid from the first plan line's custodian account). */
export interface PlaceBlockBody {
  entityId: string;
  order: { bookKey: string; side: 'buy'; type?: 'limit' | 'market' | 'stop' | 'stop_limit'; tif?: 'gtc' | 'gtd' | 'ioc' | 'fok'; quantity: number; limitCents?: number; stopCents?: number; postOnly?: boolean; displayQuantity?: number; expiresAt?: string; algo?: 'twap' | 'vwap'; algoEndsAt?: string; clientOrderId?: string };
  /** Units per sub-account; they must add up to the order's quantity. The first line leads. */
  plan: BlockPlanLine[];
  note?: string | null;
}

export interface BlockLine {
  subaccountId: string;
  accountId: string;
  lead: boolean;
  plannedQuantity: number;
  allocatedQuantity: number | null;
  avgPriceCents: number | null;
  /** This share's cash (fees included) moved to the lead's custodian account, in cents. */
  cashCents: number | null;
  status: 'planned' | 'units_moved' | 'allocated' | 'needs_ops';
  error: string | null;
  allocatedAt: string | null;
}

export interface BlockOrderView {
  orderId: string;
  entityId: string;
  status: 'working' | 'allocating' | 'allocated' | 'nothing_filled';
  note: string | null;
  fixAllocId: string | null;
  order: { bookKey: string; side: string; quantity: number; filledQuantity: number; avgFillCents: number | null; status: string; limitCents: number | null } | null;
  lines: BlockLine[];
  createdAt: string;
  allocatedAt: string | null;
  method: string;
}

export interface BlockList { data: BlockOrderView[] }
export interface AllocateResult { outcome: 'allocated' | 'waiting' | 'none' | 'nothing_filled'; block: BlockOrderView }
export interface RewardConversion { rewardInstructionId: string; status: string; cents: number; account: string; createdAt: string }
export interface RewardConversionList { data: RewardConversion[] }

const id = (s: string) => encodeURIComponent(s);
const sub = (subaccountId?: string | null) => (subaccountId ? { subaccountId } : undefined);

export class VaultMarketsInstResource {
  constructor(private http: HttpClient) {}

  /** Every account you can act on: yours and each sub-account your memberships reach. */
  accounts() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/accounts' });
  }

  /** Your entities and invitations. */
  entities() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/entities' });
  }

  /** Open an entity (you become admin; the custodian starts KYB). Needs a verified ID. */
  createEntity(body: CreateEntityBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/entities', body, idempotencyKey: opts.idempotencyKey });
  }

  entity(entityId: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/entities/${id(entityId)}` });
  }

  /** Refresh KYB status from the custodian. */
  refreshKyb(entityId: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/entities/${id(entityId)}/kyb` });
  }

  /** Admin: record the entity's ECP attestation. */
  attestEcp(entityId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/entities/${id(entityId)}/ecp`, idempotencyKey: opts.idempotencyKey });
  }

  answerInvitation(entityId: string, accept: boolean, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/entities/${id(entityId)}/invitation`, body: { accept }, idempotencyKey: opts.idempotencyKey });
  }

  inviteMember(entityId: string, body: InviteMemberBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/entities/${id(entityId)}/members`, body, idempotencyKey: opts.idempotencyKey });
  }

  updateMember(entityId: string, memberId: string, body: Partial<Omit<InviteMemberBody, 'email'>>, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'PATCH', path: `/v1/vault-markets/entities/${id(entityId)}/members/${id(memberId)}`, body, idempotencyKey: opts.idempotencyKey });
  }

  removeMember(entityId: string, memberId: string) {
    return this.http.request<JsonObject>({ method: 'DELETE', path: `/v1/vault-markets/entities/${id(entityId)}/members/${id(memberId)}` });
  }

  createSubaccount(entityId: string, body: { name: string; strategyTag?: string | null; limits?: AccountLimitsBody | null }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/entities/${id(entityId)}/subaccounts`, body, idempotencyKey: opts.idempotencyKey });
  }

  setSubaccountLimits(entityId: string, subaccountId: string, limits: AccountLimitsBody | null) {
    return this.http.request<JsonObject>({ method: 'PUT', path: `/v1/vault-markets/entities/${id(entityId)}/subaccounts/${id(subaccountId)}/limits`, body: { limits } });
  }

  closeSubaccount(entityId: string, subaccountId: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/entities/${id(entityId)}/subaccounts/${id(subaccountId)}/close` });
  }

  /** The firm kill switch: halt the entity, or one sub-account (cancels its open orders). */
  halt(entityId: string, body: { reason: string; subaccountId?: string | null }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/entities/${id(entityId)}/halts`, body, idempotencyKey: opts.idempotencyKey });
  }

  clearHalt(entityId: string, haltId: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/entities/${id(entityId)}/halts/${id(haltId)}/clear` });
  }

  /** The entity's hash-chained audit trail, newest first. */
  audit(entityId: string, params: { beforeSeq?: number; limit?: number } = {}) {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: `/v1/vault-markets/entities/${id(entityId)}/audit`, query: params });
  }

  /** Mark, bid and liquidation NAV with an ASC 820 level per holding. */
  nav(subaccountId?: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/nav', query: sub(subaccountId) });
  }

  navHistory(params: { subaccountId?: string; days?: number } = {}) {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/nav/history', query: params });
  }

  /** The NAV as CSV or JSON text. */
  navFile(format: 'csv' | 'json', subaccountId?: string) {
    return this.http.request<string>({ method: 'GET', path: `/v1/vault-markets/nav/file/${format}`, query: sub(subaccountId) });
  }

  /** Upload your administrator's prices; shown labelled as yours, never a Crossly mark. */
  uploadAdminMarks(body: AdminMarksBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/admin-marks', body, idempotencyKey: opts.idempotencyKey });
  }

  /** VaR / LVaR (model figures), stress scenarios, concentration and counterparty exposure. */
  riskReport(subaccountId?: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/risk-report', query: sub(subaccountId) });
  }

  /** A key's liquidity sheet (`bookKey`, optional `units`), or an index basket's (`index` + `notional` in cents). */
  capacity(params: { bookKey?: string; units?: number; index?: string; notional?: number; bandBps?: number }) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/capacity', query: params });
  }

  tca(params: WindowParams = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/tca', query: params });
  }

  orderTca(orderId: string, subaccountId?: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/tca/${id(orderId)}`, query: sub(subaccountId) });
  }

  /** The quarterly execution-quality report (`quarter` like '2026-Q4'). */
  executionQuality(quarter?: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/execution-quality', query: quarter ? { quarter } : undefined });
  }

  orderHandling() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/order-handling' });
  }

  confirmations(params: WindowParams = {}) {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/confirmations', query: params });
  }

  confirmation(tradeId: string, subaccountId?: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/confirmations/${id(tradeId)}`, query: sub(subaccountId) });
  }

  statements(subaccountId?: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/statements', query: sub(subaccountId) });
  }

  /** A monthly statement (`month` like '2026-10'). */
  statement(month: string, subaccountId?: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/statements/${id(month)}`, query: sub(subaccountId) });
  }

  statementFile(month: string, format: 'csv' | 'json', subaccountId?: string) {
    return this.http.request<string>({ method: 'GET', path: `/v1/vault-markets/statements/${id(month)}/file/${format}`, query: sub(subaccountId) });
  }

  /** Admin: elect USD for the entity (fees and collateral in USD only; CBX rewards converted by the custodian). */
  setUsdElection(entityId: string, usdOnly: boolean, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'PUT', path: `/v1/vault-markets/entities/${id(entityId)}/usd-election`, body: { usdOnly }, idempotencyKey: opts.idempotencyKey });
  }

  /** The custodian's CBX-to-USD reward conversions for an entity that elected USD. */
  rewardConversions(entityId: string) {
    return this.http.request<RewardConversionList>({ method: 'GET', path: `/v1/vault-markets/entities/${id(entityId)}/conversions` });
  }

  /** Place a block buy split across the entity's sub-accounts at its average price. */
  placeBlock(body: PlaceBlockBody, opts: IdempotencyOpts = {}) {
    return this.http.request<BlockOrderView>({ method: 'POST', path: '/v1/vault-markets/blocks', body, idempotencyKey: opts.idempotencyKey });
  }

  /** An entity's block orders, newest first. */
  blocks(entityId: string, limit?: number) {
    return this.http.request<BlockList>({ method: 'GET', path: '/v1/vault-markets/blocks', query: { entityId, ...(limit ? { limit } : {}) } });
  }

  block(orderId: string) {
    return this.http.request<BlockOrderView>({ method: 'GET', path: `/v1/vault-markets/blocks/${id(orderId)}` });
  }

  /** Post-trade allocation of a buy you placed for one of the entity's sub-accounts (that sub-account leads). */
  setAllocation(orderId: string, plan: BlockPlanLine[], opts: IdempotencyOpts = {}) {
    return this.http.request<BlockOrderView>({ method: 'PUT', path: `/v1/vault-markets/blocks/${id(orderId)}/allocation`, body: { plan }, idempotencyKey: opts.idempotencyKey });
  }

  /** Allocate a done block now (the keeper does it too). */
  allocate(orderId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<AllocateResult>({ method: 'POST', path: `/v1/vault-markets/blocks/${id(orderId)}/allocate`, idempotencyKey: opts.idempotencyKey });
  }
}
