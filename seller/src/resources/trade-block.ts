import type { HttpClient, JsonObject, IdempotencyOpts } from './_shared.js';

export type TradePostKind = 'want' | 'offer';

export interface TradeItemInput {
  variantId: string;
  condition?: string;
  gradeKey?: string | null;
  portfolioId?: string | null;
}

export interface CreateTradePostBody {
  kind: TradePostKind;
  title: string;
  note?: string | null;
  categorySlug?: string | null;
  target?: { variantId: string; condition: string; gradeKey?: string | null } | null;
  wantText?: string | null;
  wantCashCents?: number;
  items?: TradeItemInput[];
}

export interface CreateTradeOfferBody {
  proposerStripePaymentMethodId?: string | null;
  cashCents?: number;
  cashPayer?: 'responder' | 'poster' | null;
  note?: string | null;
  /** Items you give (0..N — may be empty on a pure cash bounty). */
  fromItems: TradeItemInput[];
  /** Items you want from the poster (0..N). */
  toItems: TradeItemInput[];
}

export type TradeOfferRespond =
  | { action: 'accept'; stripePaymentMethodId?: string | null }
  | { action: 'decline' }
  | { action: 'withdraw' }
  | { action: 'counter'; cashCents?: number; cashPayer?: 'responder' | 'poster' | null; stripePaymentMethodId?: string | null; note?: string | null };

export interface EvolutionInputSelector {
  variantId: string;
  condition?: string | null;
  gradeKey?: string | null;
}

export interface CreateEvolutionRecipeBody {
  name: string;
  note?: string | null;
  /** The item that evolves (or, with inputB, the first half of a fusion). */
  inputA: EvolutionInputSelector;
  /** Optional second input — a two-item fusion. */
  inputB?: EvolutionInputSelector | null;
  /** A cosmetic you designed, carrying a COSM price (the mint cost). */
  outputCosmeticId: string;
}

export interface CreateSetRecipeBody {
  name: string;
  note?: string | null;
  /** The set members (2–60). Assembling all of them through trading unlocks the master. */
  members: EvolutionInputSelector[];
  /** The set-master cosmetic you designed, carrying a COSM price (the mint cost). */
  outputCosmeticId: string;
}

// ─── The Trade Block: peer-to-peer market swaps ─────────────────────────────
//
// Post a WANT or an OFFER, respond with a concrete one-item-each-side swap (plus
// optional cash boot), and accept/decline/counter/withdraw. On accept both
// parties pay the 9.5% market fee and both items ship to authentication; nothing
// releases until BOTH pass.

export class TradeBlockResource {
  constructor(private http: HttpClient) {}

  /** Browse open posts (wants + offers). Envelope: `{ posts }`. */
  listPosts(params: { kind?: TradePostKind; categorySlug?: string; brand?: string; model?: string; q?: string; limit?: number; offset?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/trade-block/posts', query: params });
  }

  /** One post with its items + open-offer count. Envelope: `{ post }`. */
  getPost(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/trade-block/posts/${encodeURIComponent(id)}` });
  }

  /** The trades you're a party to. Envelope: `{ trades }`. */
  listTrades() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/trade-block/trades' });
  }

  /** Post a want or an offer. */
  createPost(body: CreateTradePostBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/trade-block/posts', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Close one of your posts so it stops taking offers. */
  closePost(id: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/trade-block/posts/${encodeURIComponent(id)}/close` });
  }

  /** Respond to a post with a concrete swap. */
  createOffer(postId: string, body: CreateTradeOfferBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/trade-block/posts/${encodeURIComponent(postId)}/offers`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Accept, decline, counter, or withdraw an offer. Accepting charges both parties. */
  respond(offerId: string, body: TradeOfferRespond, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/trade-block/offers/${encodeURIComponent(offerId)}/respond`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your Trade Evolution unlocks — completed swaps that unlocked an evolved/set NFT. Envelope: `{ unlocks }`. */
  listEvolutions() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/trade-block/evolutions' });
  }

  /** Burn COSM and mint the evolved (or set-master) NFT for an unlock. */
  claimEvolution(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/trade-block/evolutions/${encodeURIComponent(id)}/claim`, idempotencyKey: opts.idempotencyKey });
  }

  /** Author a Trade Evolution recipe (born unreviewed until ops approves). */
  createEvolutionRecipe(body: CreateEvolutionRecipeBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/trade-block/evolution-recipes', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Author a set-completion recipe (born unreviewed until ops approves). */
  createSetRecipe(body: CreateSetRecipeBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/trade-block/set-recipes', body, idempotencyKey: opts.idempotencyKey });
  }
}
