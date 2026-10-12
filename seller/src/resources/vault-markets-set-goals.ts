import type { HttpClient } from './_shared.js';

// ─── Vault Markets set goals + "complete my set" ───────────────────────────
//
// `client.vaultMarkets.setGoals`. Pick a catalogue set; progress is computed
// from what you hold in the Crossly vault, and every missing piece is listed
// with its mark (marks come only from the order book). One basket bid places
// a GTC limit buy per missing piece under a hard total budget: each leg's
// limit plus the worst-case buyer fee never adds up past it. It is paid by one
// of your saved cards or your custodian account, every leg passes pre-trade
// risk like any order, and the legs are cancelled once the set is complete.
// Money fields are integer CENTS of US dollars.

export type SetGoalGradeMode = 'any' | 'ungraded' | 'exact';
export type SetGoalStatus = 'active' | 'complete' | 'archived';
export type SetBasketStatus = 'working' | 'completed' | 'ended' | 'cancelled';
export type SetBasketLegStatus = 'pending' | 'working' | 'filled' | 'cancelled' | 'rejected';
export type SetBasketSkipReason = 'no_price' | 'over_budget' | 'not_chosen' | 'too_many';

export interface SetGoalTarget {
  /** Null = any condition. */
  condition: string | null;
  gradeMode: SetGoalGradeMode;
  /** The grade an exact goal wants (e.g. "psa:10"); null otherwise. */
  gradeKey: string | null;
  /** In words: "Near mint, PSA 10". */
  text: string;
}

export interface SetCard {
  category: string;
  brandSlug: string;
  modelSlug: string;
  title: string;
  categoryName: string | null;
  pieces: number | null;
  heldInVault: number | null;
  href: string;
  goalId: string | null;
}

export interface SetCardList {
  data: SetCard[];
}

export interface SetBasketSummary {
  id: string;
  status: SetBasketStatus;
  budgetCents: number;
  committedCents: number;
  spentCents: number;
  working: number;
  filled: number;
}

export interface SetGoal {
  id: string;
  title: string;
  category: string;
  brandSlug: string;
  modelSlug: string;
  cardSetHref: string;
  href: string;
  target: SetGoalTarget;
  status: SetGoalStatus;
  completedAt: string | null;
  createdAt: string;
  held: number;
  total: number;
  complete: boolean;
  /** "7 of 22". */
  progress: string;
  setFound: boolean;
  basket: SetBasketSummary | null;
}

export interface SetGoalList {
  data: SetGoal[];
}

export interface SetGoalPiece {
  skuId: string;
  title: string;
  imageUrl: string | null;
  number: number;
  held: boolean;
  units: number;
  onShelf: boolean;
  vaultItemId: string | null;
  /** Where a bid would go: the cheapest marked book key that meets the target; null = no price yet. */
  bid: { bookKey: string; markCents: number; quality: string | null } | null;
}

export interface SetBasketLeg {
  id: string;
  skuId: string;
  title: string;
  bookKey: string;
  markCents: number | null;
  limitCents: number;
  /** The pro order behind the leg (see pro.order). */
  orderId: string | null;
  status: SetBasketLegStatus;
  error: string | null;
  filledCents: number | null;
}

export interface SetBasket {
  id: string;
  goalId: string;
  clientBasketId: string;
  status: SetBasketStatus;
  endReason: string | null;
  budgetCents: number;
  maxBpsOverMark: number;
  /** The worst-case buyer fee counted on every leg against the budget. */
  feeBoundBps: number;
  funding: 'card' | 'custodian';
  source: string;
  committedCents: number;
  spentCents: number;
  leftCents: number;
  counts: { working: number; filled: number; cancelled: number; rejected: number };
  createdAt: string;
  endedAt: string | null;
  legs: SetBasketLeg[];
}

export interface SetBasketList {
  data: SetBasket[];
}

export interface SetGoalDetail extends Omit<SetGoal, 'basket'> {
  missing: number;
  /** Missing pieces with a price, and the sum of their marks. */
  priced: number;
  missingMarkCents: number;
  tooBig: boolean;
  options: { conditions: string[]; grades: string[] };
  pieces: SetGoalPiece[];
  basket: SetBasket | null;
}

export interface SetGoalRemoved {
  id: string;
  status: 'archived';
  basketCancelled: boolean;
}

export interface SetBasketPlanLeg {
  skuId: string;
  number: number;
  title: string;
  bookKey: string;
  markCents: number;
  limitCents: number;
  /** The limit plus the worst-case buyer fee. */
  costCents: number;
}

export interface SetBasketPlan {
  goalId: string;
  complete: boolean;
  held: number;
  total: number;
  budgetCents: number;
  maxBpsOverMark: number;
  feeBoundBps: number;
  legs: SetBasketPlanLeg[];
  skipped: Array<{ skuId: string; number: number; title: string; reason: SetBasketSkipReason; text: string }>;
  committedCents: number;
  leftCents: number;
  missing: number;
}

export interface SetGoalCreateInput {
  category: string;
  brandSlug: string;
  modelSlug: string;
  condition?: string | null;
  gradeMode?: SetGoalGradeMode;
  gradeKey?: string | null;
}

export interface SetGoalTargetInput {
  condition?: string | null;
  gradeMode?: SetGoalGradeMode;
  gradeKey?: string | null;
}

export interface SetBasketPlanInput {
  /** The hard cap, cents (100 to 25,000,000). */
  budgetCents: number;
  /** How far over each mark a leg may pay, basis points (0 to 2000; default 500). */
  maxBpsOverMark?: number;
  /** Only these missing pieces (catalogue SKU ids). */
  skuIds?: string[];
}

export interface SetBasketInput extends SetBasketPlanInput {
  funding: 'card' | 'custodian';
  /** One of your saved cards, for funding 'card'. */
  stripePaymentMethodId?: string;
  /** Your own id: a retry with it returns the basket already placed. */
  clientBasketId?: string;
}

export class VaultMarketsSetGoalsResource {
  constructor(private http: HttpClient) {}

  /** Sets to start a goal on: a search with q, else the sets you hold pieces of. */
  sets(q?: string) {
    return this.http.request<SetCardList>({ method: 'GET', path: '/v1/vault-markets/set-goals/sets', query: q ? { q } : undefined });
  }

  /** Your set goals with progress and the working basket bid. */
  list() {
    return this.http.request<SetGoalList>({ method: 'GET', path: '/v1/vault-markets/set-goals' });
  }

  /** Start a goal on a catalogue set. */
  create(input: SetGoalCreateInput) {
    return this.http.request<SetGoalDetail>({ method: 'POST', path: '/v1/vault-markets/set-goals', body: input });
  }

  /** One goal: every piece, held or missing with its mark, and the working basket bid. */
  get(id: string) {
    return this.http.request<SetGoalDetail>({ method: 'GET', path: `/v1/vault-markets/set-goals/${encodeURIComponent(id)}` });
  }

  /** Change the target (refused while a basket bid works). */
  update(id: string, input: SetGoalTargetInput) {
    return this.http.request<SetGoalDetail>({ method: 'PATCH', path: `/v1/vault-markets/set-goals/${encodeURIComponent(id)}`, body: input });
  }

  /** Remove a goal (its working basket bid is cancelled first). */
  remove(id: string) {
    return this.http.request<SetGoalRemoved>({ method: 'DELETE', path: `/v1/vault-markets/set-goals/${encodeURIComponent(id)}` });
  }

  /** What a basket bid would place now, without placing it. */
  basketPlan(id: string, input: SetBasketPlanInput) {
    return this.http.request<SetBasketPlan>({
      method: 'GET',
      path: `/v1/vault-markets/set-goals/${encodeURIComponent(id)}/basket-plan`,
      query: { budgetCents: input.budgetCents, ...(input.maxBpsOverMark != null ? { maxBpsOverMark: input.maxBpsOverMark } : {}), ...(input.skuIds?.length ? { skuIds: input.skuIds.join(',') } : {}) },
    });
  }

  /** Place the "complete my set" basket bid. */
  placeBasket(id: string, input: SetBasketInput) {
    return this.http.request<SetBasket>({ method: 'POST', path: `/v1/vault-markets/set-goals/${encodeURIComponent(id)}/basket`, body: input });
  }

  /** Cancel the working basket bid (what filled stays yours). */
  cancelBasket(id: string) {
    return this.http.request<SetBasket>({ method: 'POST', path: `/v1/vault-markets/set-goals/${encodeURIComponent(id)}/basket/cancel` });
  }

  /** The goal's basket bids, newest first. */
  baskets(id: string, limit?: number) {
    return this.http.request<SetBasketList>({ method: 'GET', path: `/v1/vault-markets/set-goals/${encodeURIComponent(id)}/baskets`, query: limit ? { limit } : undefined });
  }
}
