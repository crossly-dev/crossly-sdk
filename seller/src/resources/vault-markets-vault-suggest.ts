import type { HttpClient } from './_shared.js';

// ─── Vault Markets: "What should I vault?" ──────────────────────────────────
//
// `client.vaultMarkets.vaultSuggestions`. Your inventory items whose book key
// has a liquid vault market (liquidity tier A, B or C), ranked by the tier,
// the Instant Exit bid against your own list price, the spread and how long
// the item has been listed without selling. Each shows the market, Instant
// Exit now and the vault fee. Read only and inform only: send items with
// `client.vaultMarkets.supply.send`. Money fields are integer CENTS of US
// dollars; shares are basis points.

export type VaultSuggestTier = 'A' | 'B' | 'C';
export type VaultSuggestStrength = 'strong' | 'good' | 'worth_a_look';
export type VaultSuggestItemStatus = 'suggested' | 'not_found' | 'no_stock' | 'not_matched' | 'in_vault' | 'no_market';

export interface VaultSuggestMarket {
  tier: VaultSuggestTier;
  tierLabel: string;
  markCents: number | null;
  /** The mark's quality: A trade-anchored, B two-sided firm mid, C indicative, or none. */
  markQuality: string;
  bestBidCents: number | null;
  bestAskCents: number | null;
  /** Best bid to best vault ask as basis points of their mid; null when one side is missing. */
  spreadBps: number | null;
}

export interface VaultSuggestInstantExit {
  /** The best bid can be sold into in one tap right now. */
  available: boolean;
  priceCents: number | null;
  shareOfMarkBps: number | null;
  reason: string | null;
  line: string;
}

export interface VaultSuggestFee {
  /** Selling into a bid (taker, retail rate; your rate can only be lower). */
  sellNowFeeBps: number;
  sellNowFeeCents: number | null;
  /** A resting ask that is filled (maker, retail rate). */
  listFeeBps: number;
  storageCentsPerMonth: number;
  /** The best bid less the sell-now fee. */
  netNowCents: number | null;
  line: string;
}

export interface VaultSuggestion {
  inventoryItemId: string;
  title: string | null;
  imageUrl: string | null;
  unitsToSend: number;
  bookKey: string;
  variantId: string;
  condition: string;
  gradeKey: string | null;
  market: VaultSuggestMarket;
  instantExit: VaultSuggestInstantExit;
  listPriceCents: number | null;
  /** Best bid as basis points of your list price (or of the mark with no list price, see exitBasis). */
  exitVsListBps: number | null;
  exitBasis: 'list_price' | 'mark' | null;
  daysListed: number | null;
  vaultFee: VaultSuggestFee;
  /** 0 to 100. */
  score: number;
  strength: VaultSuggestStrength;
  parts: { tier: number; exitVsList: number; spread: number; daysListed: number };
  reasons: string[];
  marketPath: string;
}

export interface VaultSuggestSummary {
  scanned: number;
  unmatched: number;
  inVault: number;
  noMarket: number;
  keysSkipped: number;
}

export interface VaultSuggestionList {
  data: VaultSuggestion[];
  meta?: { summary: VaultSuggestSummary; note: string };
}

export interface VaultSuggestionForItem {
  inventoryItemId: string;
  status: VaultSuggestItemStatus;
  message: string;
  suggestion: VaultSuggestion | null;
}

export class VaultMarketsVaultSuggestResource {
  constructor(private http: HttpClient) {}

  /** Your inventory with a liquid vault market, best first (`limit` 1 to 100, default 25). */
  list(limit?: number) {
    return this.http.request<VaultSuggestionList>({ method: 'GET', path: '/v1/vault-markets/vault-suggestions', query: limit != null ? { limit: String(limit) } : undefined });
  }

  /** One inventory item: its suggestion, or why there is none. */
  forItem(inventoryItemId: string) {
    return this.http.request<VaultSuggestionForItem>({ method: 'GET', path: `/v1/vault-markets/vault-suggestions/items/${encodeURIComponent(inventoryItemId)}` });
  }
}
