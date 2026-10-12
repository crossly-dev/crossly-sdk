import type { HttpClient, IdempotencyOpts, JsonObject } from './_shared.js';

// ─── Vault Markets ops: gifts, the tax centre, vault auctions, sell-now ─────
//
// `client.vaultMarkets.ops`. Units move between vaults (gifts to another user,
// gifts to Crossly Cares) without leaving the shelf; money only ever moves
// through the order book. Also the investor tax centre, scheduled vault
// auctions with proxy bidding, and Instant Exit on one unit. Every money field
// is integer CENTS of US dollars.
//
// The tax-year PDF (`GET /v1/vault-markets/tax.pdf`) is a binary file and has
// no method here: every SDK call decodes the body as text, which would corrupt
// it. `tax()` returns its link in `files.pdf`; fetch it with your token.

export type VaultAuctionKind = 'weekly' | 'premier';

export interface GiftVaultUnitBody {
  vaultItemId: string;
  /** A Crossly @username / handle or an email. */
  to: string;
  note?: string | null;
}

export interface ConsignVaultLotBody {
  vaultItemId: string;
  /** `weekly` (default, ends Sunday) or `premier` (units marked $10,000+). */
  kind?: VaultAuctionKind;
  /** Opening price, in cents. */
  startCents?: number | null;
  /** Reserve, in cents. */
  reserveCents?: number | null;
}

const id = (s: string) => encodeURIComponent(s);

export class VaultMarketsOpsResource {
  constructor(private http: HttpClient) {}

  /** Give a unit to another Crossly user; they have 7 days to accept. ID needed above $1,000 at the mark. */
  gift(body: GiftVaultUnitBody, opts: IdempotencyOpts = {}) {
    return this.http.request<{ id: string; expiresAt: string }>({ method: 'POST', path: '/v1/vault-markets/gifts', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Gifts you sent and received, newest first. */
  gifts() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/gifts' });
  }

  /** Accept a gift: the unit becomes yours in place. */
  acceptGift(giftId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ status: string }>({ method: 'POST', path: `/v1/vault-markets/gifts/${id(giftId)}/accept`, idempotencyKey: opts.idempotencyKey });
  }

  /** Decline a gift: the unit stays with the giver. */
  declineGift(giftId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ status: string }>({ method: 'POST', path: `/v1/vault-markets/gifts/${id(giftId)}/decline`, idempotencyKey: opts.idempotencyKey });
  }

  /** Cancel a gift you sent before it is accepted. */
  cancelGift(giftId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ status: string }>({ method: 'POST', path: `/v1/vault-markets/gifts/${id(giftId)}/cancel`, idempotencyKey: opts.idempotencyKey });
  }

  /** Give a unit to Crossly Cares (once the charity can receive). */
  donate(vaultItemId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ id: string; markCents: number }>({ method: 'POST', path: '/v1/vault-markets/donations', body: { vaultItemId }, idempotencyKey: opts.idempotencyKey });
  }

  /** Your tax year on the vault markets (default this year), with links to the CSV and PDF. */
  tax(year?: number) {
    return this.http.request<JsonObject & { files: { csv: string; pdf: string } }>({ method: 'GET', path: '/v1/vault-markets/tax', query: year ? { year } : undefined });
  }

  /** The tax year as CSV text. */
  taxCsv(year?: number) {
    return this.http.request<string>({ method: 'GET', path: '/v1/vault-markets/tax.csv', query: year ? { year } : undefined });
  }

  /** Open vault auction events and their lots, soonest ending first. */
  auctions(kind?: VaultAuctionKind) {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/auctions', query: kind ? { kind } : undefined });
  }

  /** Lots you consigned and lots you bid on. */
  myAuctions() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/auctions/mine' });
  }

  /** One lot: price showing, next minimum bid, reserve, end, bid history and your standing. */
  lot(lotId: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/auctions/lots/${id(lotId)}` });
  }

  /** Consign a stored, authenticated unit to the next event; it is held until the close. */
  consign(body: ConsignVaultLotBody, opts: IdempotencyOpts = {}) {
    return this.http.request<{ lotId: string; eventId: string; endsAt: string }>({ method: 'POST', path: '/v1/vault-markets/auctions/lots', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Withdraw your lot before any bid. */
  withdrawLot(lotId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ ok: boolean }>({ method: 'POST', path: `/v1/vault-markets/auctions/lots/${id(lotId)}/withdraw`, idempotencyKey: opts.idempotencyKey });
  }

  /** Leave or raise your maximum (cents) on a lot; the saved card is charged at the close if you win. */
  bid(lotId: string, body: { maxCents: number; stripePaymentMethodId: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/auctions/lots/${id(lotId)}/bids`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Feature an open lot on your live show, or `null` to take it off. */
  featureLot(liveStreamId: string, lotId: string | null, opts: IdempotencyOpts = {}) {
    return this.http.request<{ ok: boolean }>({ method: 'POST', path: `/v1/vault-markets/live-streams/${id(liveStreamId)}/featured-lot`, body: { lotId }, idempotencyKey: opts.idempotencyKey });
  }

  /** The market around a vault unit: mark, best bid, Instant Exit price, a pack pull's sell-back credit. */
  unitQuote(vaultItemId: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/units/${id(vaultItemId)}/quote` });
  }

  /** Sell one unit now into the best bid, never below `minCents`. */
  sellNow(vaultItemId: string, minCents?: number | null, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/units/${id(vaultItemId)}/sell-now`, body: minCents == null ? {} : { minCents }, idempotencyKey: opts.idempotencyKey });
  }
}
