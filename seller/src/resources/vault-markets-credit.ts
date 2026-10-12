import type { HttpClient, IdempotencyOpts, JsonObject } from './_shared.js';

// ─── Vault Markets credit: borrow against your vault ────────────────────────
//
// `client.vaultMarkets.credit`. Cash-out loans against stored vault units and
// advances against units listed for sale, lent by the market pool into your
// custodian account. Pledged units cannot be listed, lent or withdrawn until
// repaid. Every money field is integer CENTS of US dollars. Opening a loan or
// an advance needs a verified ID (`vaultMarkets.startIdentity()`). Reads need
// `vault-markets:read`, anything that moves money `vault-markets:trade`.

export type VaultCreditStatus = 'live' | 'closed' | 'all';
export type VaultCreditKind = 'loan' | 'advance';

export interface RepayVaultCreditBody {
  /** In cents; omit to repay everything owed (interest first). */
  amountCents?: number;
  /** Your own id for this repayment: a retry with the same id never pays twice. */
  requestId?: string;
}

const id = (s: string) => encodeURIComponent(s);

export class VaultMarketsCreditResource {
  constructor(private http: HttpClient) {}

  /** Your loans and advances (live by default): owed, interest, loan-to-value, liquidation line. */
  list(params: { status?: VaultCreditStatus; kind?: VaultCreditKind } = {}) {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/credit', query: params });
  }

  /** One loan or advance with its pledged units and money log. */
  get(creditId: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/credit/${id(creditId)}` });
  }

  /** Repay from your custodian account, interest first. Repaid in full, the items are free. */
  repay(creditId: string, body: RepayVaultCreditBody = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/credit/${id(creditId)}/repay`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** How much you can borrow against vault units (none = every stored unit you hold). */
  loanQuote(vaultItemIds?: string[]) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/loans/quote', query: vaultItemIds?.length ? { vaultItemIds: vaultItemIds.join(',') } : undefined });
  }

  /** Borrow `amountCents` against stored vault units (1-50); they are pledged. */
  openLoan(body: { vaultItemIds: string[]; amountCents: number }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/loans', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Pledge more stored units to a loan (answers a loan call, or makes room). */
  pledgeMore(loanId: string, vaultItemIds: string[], opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/loans/${id(loanId)}/units`, body: { vaultItemIds }, idempotencyKey: opts.idempotencyKey });
  }

  /** Free one pledged unit, if what is owed still fits inside the other units' limit. */
  releaseUnit(loanId: string, vaultItemId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/loans/${id(loanId)}/units/${id(vaultItemId)}/release`, idempotencyKey: opts.idempotencyKey });
  }

  /** The lowest price a pledged unit can be sold at to repay its loan (and what is owed). */
  saleFloor(loanId: string, vaultItemId: string) {
    return this.http.request<{ floorCents: number; owedCents: number; otherUnitsCarryCents: number }>({ method: 'GET', path: `/v1/vault-markets/loans/${id(loanId)}/units/${id(vaultItemId)}/sale-floor` });
  }

  /** Sell a pledged unit to repay its loan: listed at `priceCents` (at least the sale floor); calling again re-prices it. */
  sellPledged(loanId: string, vaultItemId: string, priceCents: number, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/loans/${id(loanId)}/units/${id(vaultItemId)}/sell`, body: { priceCents }, idempotencyKey: opts.idempotencyKey });
  }

  /** What an advance on a vault unit for sale could be. */
  advanceQuote(vaultItemId: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/advances/quote', query: { vaultItemId } });
  }

  /** Take an advance against a listed vault unit, netted from its sale. Free for 60 days. */
  openAdvance(body: { vaultItemId: string; amountCents: number }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/advances', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Relist an advance's unit at a new price, in cents (never below what repays the advance). */
  relistAdvance(advanceId: string, priceCents: number, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/advances/${id(advanceId)}/relist`, body: { priceCents }, idempotencyKey: opts.idempotencyKey });
  }
}
