import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Vault receipt tokens on Solana ─────────────────────────────────────────
//
// `client.vaultMarkets.receiptTokens`. Optional and explicit: one vault unit's
// warehouse receipt goes out to one of YOUR verified Solana wallets as a
// Token-2022 token (0 decimals, supply 1, transfer hook = the receipts
// program). It is minted only when your wallet signs the transaction `export`
// returns, frozen while the unit is pledged or lent, and burned when you
// redeem it (or when the unit leaves the vault). While it is out, the token
// is the title: the unit cannot be sold, moved, lent or withdrawn on Crossly
// until it is redeemed. Not CBX. Reads need `vault-markets:read`; export and
// redeem need `vault-markets:trade`.

export type ReceiptTokenStatus = 'pending' | 'live' | 'frozen' | 'burned' | 'expired' | 'conflict';

export interface ReceiptTokensState {
  open: boolean;
  missing: string[];
  programId: string | null;
  authority: string | null;
  termsVersion: string | null;
  cluster: string;
  note: string;
}

export interface ReceiptToken {
  id: string;
  vaultItemId: string;
  receiptNo: string;
  status: ReceiptTokenStatus;
  statusText: string;
  frozen: boolean;
  wallet: string;
  holder: string | null;
  mint: string;
  tokenAccount: string;
  programId: string;
  cluster: string;
  explorerUrl: string;
  mintSignature: string | null;
  burnSignature: string | null;
  burnReason: string | null;
  conflictReason: string | null;
  termsVersion: string;
  mine: boolean;
  createdAt: string;
  liveAt: string | null;
  closedAt: string | null;
}

export interface ReceiptTokenUnit {
  vaultItemId: string;
  title: string | null;
  imageUrl: string | null;
  bookKey: string | null;
  status: string;
  receiptNo: string | null;
  receiptStatus: string | null;
  pledged: boolean;
  onLoan: boolean;
  token: ReceiptToken | null;
  exportable: boolean;
  blocker: string | null;
}

export interface ReceiptTokenUnitList {
  data: ReceiptTokenUnit[];
  meta?: { state?: ReceiptTokensState; history?: ReceiptToken[] };
}

export interface ReceiptTokenEvent { kind: string; signature: string | null; actor: string; at: string; explorerUrl: string | null }
export interface ReceiptTokenDetail { token: ReceiptToken; events: ReceiptTokenEvent[] }

export interface ReceiptTokenByMint {
  mint: string;
  receiptNo: string;
  status: ReceiptTokenStatus;
  statusText: string;
  frozen: boolean;
  bookKey: string | null;
  title: string | null;
  imageUrl: string | null;
  unitOnShelf: boolean;
  programId: string;
  cluster: string;
  liveAt: string | null;
  closedAt: string | null;
}

/** A transaction for your wallet to sign and send (base64, legacy format). */
export interface ReceiptTokenExportBuilt {
  token: ReceiptToken;
  transactionBase64: string;
  recentBlockhash: string;
  lastValidBlockHeight: number;
  /** Rent your wallet pays (mint + token account), in lamports, besides the fee. */
  rentLamports: number;
}

export interface ReceiptTokenRedeemBuilt {
  token: ReceiptToken;
  transactionBase64: string;
  recentBlockhash: string;
  lastValidBlockHeight: number;
}

export interface ReceiptTokenConfirmed { token: ReceiptToken; confirmed: boolean }
export interface ReceiptTokenRedeemed { token: ReceiptToken; redeemed: boolean }

export interface ExportReceiptTokenBody {
  vaultItemId: string;
  /** One of your verified Solana wallets: it receives the token and pays the rent. */
  wallet: string;
  /** The current terms version (meta.state.termsVersion). */
  acceptTerms: string;
}

/** A wallet's place on the receipt-token allow-list (tokens move only between allow-listed wallets). */
export type ReceiptTokenWalletStatus = 'allowed' | 'not_allowed' | 'revoked';

export interface ReceiptTokenWallet {
  wallet: string;
  status: ReceiptTokenWalletStatus;
  statusText: string;
  updatedAt: string | null;
  /** A transaction for this wallet was built and has not landed yet. */
  pending: boolean;
}

export interface ReceiptTokenWalletList {
  data: ReceiptTokenWallet[];
  meta?: { state?: ReceiptTokensState };
}

/** A set_allowlist transaction for the wallet to sign and send (base64, legacy format). */
export interface ReceiptTokenAllowBuilt {
  wallet: string;
  transactionBase64: string;
  recentBlockhash: string;
  lastValidBlockHeight: number;
  /** Rent the wallet pays for its allow-list entry, in lamports, besides the fee. */
  rentLamports: number;
}

export interface AllowReceiptTokenWalletBody {
  /** One of your verified Solana wallets: it signs and pays for its own entry. */
  wallet: string;
}

const id = (s: string) => encodeURIComponent(s);

export class VaultMarketsReceiptTokensResource {
  constructor(private http: HttpClient) {}

  /** Your units with their receipt and token state; meta.state is the gate, meta.history your exports. */
  units() {
    return this.http.request<ReceiptTokenUnitList>({ method: 'GET', path: '/v1/vault/receipt-tokens' });
  }

  /** One token with its chain log. */
  get(tokenId: string) {
    return this.http.request<ReceiptTokenDetail>({ method: 'GET', path: `/v1/vault/receipt-tokens/${id(tokenId)}` });
  }

  /** What a mint is (receipt, item, live / frozen / burned), naming nobody. */
  byMint(mint: string) {
    return this.http.request<ReceiptTokenByMint>({ method: 'GET', path: `/v1/vault/receipt-tokens/by-mint/${id(mint)}` });
  }

  /** Build the export: your wallet signs and sends the returned transaction, then call confirm. */
  export(body: ExportReceiptTokenBody, opts: IdempotencyOpts = {}) {
    return this.http.request<ReceiptTokenExportBuilt>({ method: 'POST', path: '/v1/vault/receipt-tokens/export', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Read the chain after your wallet sent the export. */
  confirm(tokenId: string, body: { signature?: string } = {}) {
    return this.http.request<ReceiptTokenConfirmed>({ method: 'POST', path: `/v1/vault/receipt-tokens/${id(tokenId)}/confirm`, body });
  }

  /** Build the redeem (a burn your wallet signs) for a token held in one of your verified wallets. */
  redeem(tokenId: string, body: { wallet: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<ReceiptTokenRedeemBuilt>({ method: 'POST', path: `/v1/vault/receipt-tokens/${id(tokenId)}/redeem`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your verified Solana wallets and whether each is on the receipt-token allow-list. */
  wallets() {
    return this.http.request<ReceiptTokenWalletList>({ method: 'GET', path: '/v1/vault/receipt-tokens/wallets' });
  }

  /** Build the allow-list entry for one of your wallets: it signs, pays and sends the returned transaction. */
  allowWallet(body: AllowReceiptTokenWalletBody, opts: IdempotencyOpts = {}) {
    return this.http.request<ReceiptTokenAllowBuilt>({ method: 'POST', path: '/v1/vault/receipt-tokens/wallets/allow', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Read the chain after your wallet sent the redeem: the unit lands in your vault. */
  confirmRedeem(tokenId: string, body: { signature?: string } = {}) {
    return this.http.request<ReceiptTokenRedeemed>({ method: 'POST', path: `/v1/vault/receipt-tokens/${id(tokenId)}/redeem/confirm`, body });
  }
}
