import type { HttpClient } from './_shared.js';

// ─── Vault Markets oracle publishing + partner index futures/options ────────
//
// `client.vaultMarkets.oracleDcm`. Crossly publishes its built-in indexes as
// an oracle feed (Pyth Pro or Switchboard on-demand), every value signed with
// a dedicated ed25519 key, and shows a partner exchange's (DCM) futures and
// options on those indexes read-only. Crossly is the index licensor and data
// provider: it never lists, prices, matches or clears a contract, never holds
// a position, and never reads its own published feed back as a price. Money
// fields are integer CENTS of US dollars; contract prices are index points.

export type OracleNetworkName = 'pyth' | 'switchboard';
export type OraclePublicationStatus = 'published' | 'skipped' | 'failed';

export interface OracleLatestAttempt {
  status: OraclePublicationStatus;
  reason: string | null;
  reasonText: string | null;
  level: number | null;
  confidenceBps: number | null;
  stalenessSec: number | null;
  at: string;
}

export interface OracleFeedView {
  id: string;
  indexSlug: string;
  network: OracleNetworkName;
  /** The network's id for the feed. */
  feedId: string;
  exponent: number;
  status: 'active' | 'paused';
  latest: OracleLatestAttempt | null;
}

export interface OracleStatus {
  label: string;
  notReadBack: string;
  /** False until CROSSLY_ORACLE_PUBLISHER_KEY and CROSSLY_ORACLE_NETWORK are set (`missing` names them). */
  open: boolean;
  missing: string[];
  /** Why CROSSLY_ORACLE_ENDPOINT is listed as missing when it is set but unusable. */
  problem?: string | null;
  network: OracleNetworkName | null;
  /** Pyth Pro only: "relayer" (Crossly signs each Lazer transaction) or "agent" (a pyth-lazer-agent signs). */
  pythMode?: 'relayer' | 'agent' | null;
  /** The ed25519 public key (base58) every value is signed with. */
  signer: string | null;
  everySec: number;
  version: string;
  rules: { minCoverageBps: number; minKeys: number; maxStaleSec: number; maxConfBps: number };
  feeds: OracleFeedView[];
  last24h: { published: number; skipped: number; failed: number };
}

export interface OraclePublication {
  id: string;
  indexSlug: string;
  network: string;
  feedId: string;
  status: OraclePublicationStatus;
  reason: string | null;
  reasonText: string | null;
  level: number | null;
  /** Fixed-point integer strings at `exponent`. */
  price: string | null;
  conf: string | null;
  exponent: number;
  confidenceBps: number | null;
  stalenessSec: number | null;
  coverageBps: number | null;
  keys: number | null;
  basis: string | null;
  publishTimeUs: number | null;
  signer: string | null;
  httpStatus: number | null;
  error: string | null;
  at: string;
}

export interface OraclePublicationList {
  data: OraclePublication[];
}

export interface OracleSignedValue extends OraclePublication {
  feed: string;
  version: string;
  label: string;
  /** The exact signed string; verify `signature` (ed25519, base64) over its UTF-8 bytes with `signer`. */
  message: string | null;
  signature: string | null;
  publishTime: string;
  ageSec: number;
  fresh: boolean;
}

export type DcmContractKindName = 'perp' | 'future' | 'option';

export interface DcmContractView {
  symbol: string;
  name: string | null;
  kind: DcmContractKindName;
  indexSlug: string | null;
  /** Dollars of notional per 1.0 of index level. */
  multiplier: number | null;
  tick: number | null;
  expiry: string | null;
  strike: number | null;
  optionType: 'call' | 'put' | null;
  underlying: string | null;
  status: string;
  fetchedAt: string;
}

export interface DcmOverview {
  /** False until VAULT_INDEX_DCM, VAULT_INDEX_DCM_API_URL and VAULT_INDEX_DCM_API_KEY are set. */
  open: boolean;
  missing: string[];
  dcm: string | null;
  readOnly: string;
  note: string;
  lastSyncAt: string | null;
  contracts: DcmContractView[];
}

export interface CrosslyIndexLevelRef {
  slug: string;
  name: string;
  value: number;
  day: string;
}

export interface DcmFundingPrintView {
  periodStart: string;
  rateBps: number;
  premiumBps: number | null;
  indexLevel: number | null;
  printedAt: string | null;
}

export interface DcmContractDetail {
  dcm: string;
  contract: DcmContractView;
  index: CrosslyIndexLevelRef | null;
  readOnly: string;
  funding: { prints: DcmFundingPrintView[]; annualisedBps: number | null; periodsPerDay: number; settledBy: string };
}

export interface DcmBookLevel {
  price: number;
  size: number;
}

export interface DcmBookView {
  dcm: string;
  symbol: string;
  kind: DcmContractKindName;
  bids: DcmBookLevel[];
  asks: DcmBookLevel[];
  markPrice: number | null;
  indexPrice: number | null;
  lastPrice: number | null;
  openInterest: number | null;
  volume24h: number | null;
  asOf: string | null;
  spreadBps: number | null;
  /** (mark - Crossly index) / Crossly index, bps. */
  basisBps: number | null;
  crosslyIndex: CrosslyIndexLevelRef | null;
  readOnly: string;
  fetchedAt: string;
}

export interface DcmPositionView {
  symbol: string;
  side: 'long' | 'short';
  contracts: number;
  entryPrice: number | null;
  markPrice: number | null;
  unrealizedPnlCents: number | null;
  marginCents: number | null;
  liquidationPrice: number | null;
  kind: DcmContractKindName | null;
  indexSlug: string | null;
  notionalCents: number | null;
}

export interface DcmMyPositions {
  dcm: string | null;
  open: boolean;
  missing: string[];
  readOnly: string;
  linked: boolean;
  accountRef: string | null;
  linkedAt: string | null;
  /** When its category-index futures were last reported to portfolio margin as hedges. */
  hedgesReportedAt: string | null;
  /** The vault account the partner positions belong to: your own, or a firm sub-account. */
  account: { accountId: string; kind: 'individual' | 'subaccount'; label: string; subaccountId: string | null };
  positions: DcmPositionView[];
}

export interface DcmUnlinked {
  linked: boolean;
}

export interface DcmLinkInput {
  /** Your account id at the partner exchange. */
  accountRef: string;
  /** The one-time link code the partner gave you (never stored). */
  code: string;
  /** Link it to this firm sub-account (you must manage it) instead of your own account. */
  subaccountId?: string;
}

export interface DcmAccountParams {
  /** A firm sub-account you belong to; omit for your own account. */
  subaccountId?: string;
}

export interface Black76GreeksView {
  price: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
}

export interface DcmOptionsGridRow {
  expiryDays: number;
  strikePct: number;
  strike: number;
  sdMoveBps: number;
  call: Black76GreeksView | null;
  put: Black76GreeksView | null;
}

export interface DcmListedOption {
  symbol: string;
  optionType: 'call' | 'put' | null;
  strike: number | null;
  expiry: string | null;
  underlying: string | null;
  greeks: Black76GreeksView | null;
}

export interface DcmOptionsInputs {
  label: string;
  derived: true;
  index: string;
  dcm: string | null;
  vol: {
    volBps: number | null; basis: 'desmoothed' | 'raw' | null; annualisedVolBps: number | null; desmoothedVolBps: number | null;
    desmoothingPhi: number | null; n: number; insufficient: boolean; reason: string | null; firstWeek: string | null; lastWeek: string | null;
  };
  forward: { value: number | null; source: 'partner_mark' | 'crossly_close' | 'none'; symbol: string | null };
  rateBps: number;
  grid: DcmOptionsGridRow[];
  listed: DcmListedOption[];
  asOf: string;
}

export interface OracleHistoryParams {
  limit?: number;
  status?: OraclePublicationStatus;
}

const seg = (s: string) => encodeURIComponent(s);

export class VaultMarketsOracleDcmResource {
  constructor(private http: HttpClient) {}

  /** The oracle publisher: network, signer key, feeds with their latest attempt, 24 h counts. */
  oracle() {
    return this.http.request<OracleStatus>({ method: 'GET', path: '/v1/vault-markets/oracle' });
  }

  /** The latest published (signed) oracle value for an index. */
  oracleLatest(slug: string) {
    return this.http.request<OracleSignedValue>({ method: 'GET', path: `/v1/vault-markets/oracle/${seg(slug)}` });
  }

  /** Recent publish attempts for an index, newest first. */
  oracleHistory(slug: string, params: OracleHistoryParams = {}) {
    return this.http.request<OraclePublicationList>({ method: 'GET', path: `/v1/vault-markets/oracle/${seg(slug)}/history`, query: { ...params } });
  }

  /** The partner exchange and its contracts as last read. */
  dcm() {
    return this.http.request<DcmOverview>({ method: 'GET', path: '/v1/vault-markets/dcm' });
  }

  /** One partner contract: spec, funding prints, the Crossly index it settles on. */
  dcmContract(symbol: string) {
    return this.http.request<DcmContractDetail>({ method: 'GET', path: `/v1/vault-markets/dcm/contracts/${seg(symbol)}` });
  }

  /** The partner exchange live book for a contract, with spread and basis. */
  dcmBook(symbol: string) {
    return this.http.request<DcmBookView>({ method: 'GET', path: `/v1/vault-markets/dcm/contracts/${seg(symbol)}/book` });
  }

  /** Realised-vol inputs and Black-76 greeks for an index. */
  dcmOptionsInputs(slug: string) {
    return this.http.request<DcmOptionsInputs>({ method: 'GET', path: `/v1/vault-markets/dcm/options-inputs/${seg(slug)}` });
  }

  /** Your linked partner account and its positions (read-only). */
  dcmPositions(params: DcmAccountParams = {}) {
    return this.http.request<DcmMyPositions>({ method: 'GET', path: '/v1/vault-markets/dcm/positions', query: { ...params } });
  }

  /** Link your partner exchange account with the one-time code it gave you. */
  dcmLink(input: DcmLinkInput) {
    return this.http.request<DcmMyPositions>({ method: 'POST', path: '/v1/vault-markets/dcm/link', body: { ...input } });
  }

  /** Unlink your partner exchange account. */
  dcmUnlink(params: DcmAccountParams = {}) {
    return this.http.request<DcmUnlinked>({ method: 'POST', path: '/v1/vault-markets/dcm/unlink', body: { ...params } });
  }
}
