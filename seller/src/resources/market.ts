import type { HttpClient, JsonObject, PaginationParams } from './_shared.js';

/**
 * The Crossly Market — public order-book data.
 *
 * Read-only on purpose. Placing a bid moves money off a saved card and creates
 * a binding obligation, which belongs behind a buyer principal with its own
 * consent flow rather than behind a seller's API token.
 *
 * ── The one thing to understand before using this ────────────────────
 *
 * A product does not have "a price". The book is kept per
 * `(variant, condition, grade)` — and a grade is not a modifier on a price, it
 * is which MARKET the item trades in. The same card is $414 raw and $12,168 in
 * a PSA 10. So `lowestAskCentsFrom` on a product is exactly what its name
 * says: the cheapest way to own it in ANY tier. To price a specific item, read
 * `tiers()`.
 */
export interface MarketTier {
  condition: string;
  /** null = ungraded. */
  gradeKey: string | null;
  /** Human label, e.g. "PSA 10" or "Ungraded". Produced server-side. */
  label: string;
  lowestAskCents: number | null;
  highestBidCents: number | null;
  openAsks: number;
  openBids: number;
  lastSaleCents: number | null;
  tradesCount: number;
}

export interface MarketGrader {
  slug: string;
  name: string;
  categorySlugs: string[];
  scale: 'numeric' | 'sheldon' | 'dual' | 'hundred';
  /** Every grade this company issues, best first. */
  grades: string[];
  qualifiers: string[];
  sealGrades: string[];
}

export interface MarketBookLevel {
  priceCents: number;
  count: number;
}

/** One metal's spot: US cents per troy ounce of pure metal. */
export interface MetalSpot {
  metal: string;
  priceCents: number | null;
  fetchedAt: string | null;
  /** Older than the window pegged orders trade on. */
  stale: boolean;
}

export interface MetalSpotHistory {
  metal: string;
  range: string;
  points: { at: string; priceCents: number }[];
}

export class MarketResource {
  constructor(private http: HttpClient) {}

  /**
   * Browse approved products.
   *
   * `graded` / `grader` / `minGrade` narrow to the graded surface. `minGrade`
   * needs `grader`, because grade values are only comparable within one
   * company's scale — a coin's `MS-65` and a card's `65` are not the same kind
   * of number, and one of them does not exist.
   */
  listProducts(params: PaginationParams & {
    categorySlug?: string;
    search?: string;
    graded?: boolean;
    grader?: string;
    minGrade?: string;
  } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/market/products',
      query: params,
    });
  }

  /**
   * One product and its variants. `product.images` carries every photo beyond
   * the hero: `photos` (still angles, hero first, each with a `thumbUrl`) and
   * `spin` (360 frames in rotation order). Both are empty when there are none.
   */
  getProduct(id: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/market/products/${encodeURIComponent(id)}`,
    });
  }

  /**
   * What sits around one product — the same bundle its page renders.
   * `rails` are product lists (`similar`, `also_viewed`, `brand`, `category`),
   * each with the directory page it previews; `breadcrumb` is the product's
   * place in the catalogue; `explore` groups directory pages around it;
   * `searches` are popular searches that each name a page.
   */
  related(id: string) {
    return this.http.request<{ data: JsonObject }>({
      method: 'GET',
      path: `/v1/market/products/${encodeURIComponent(id)}/related`,
    });
  }

  /**
   * Precious-metal spot: gold, silver, platinum, palladium in US cents per troy
   * ounce of pure metal. `stale` means older than the window pegged orders
   * trade on — show it, do not price off it.
   */
  metalsSpot() {
    return this.http.request<{ data: MetalSpot[] }>({
      method: 'GET',
      path: '/v1/market/metals/spot',
    });
  }

  /** Spot history for one metal: '1d' | '7d' | '30d' | '1y'. */
  metalsSpotHistory(metal: 'gold' | 'silver' | 'platinum' | 'palladium', range: '1d' | '7d' | '30d' | '1y' = '30d') {
    return this.http.request<{ data: MetalSpotHistory }>({
      method: 'GET',
      path: '/v1/market/metals/spot/history',
      query: { metal, range },
    });
  }

  /**
   * Bullion by metal, form (bullion_coin | bar | round) and size, ordered by
   * `premium` (lowest premium over spot), `per_oz`, `price_low`, `price_high`
   * or `popular`. Each item carries its pure content, melt value at spot,
   * premium and price per ounce; `meta.facets` gives counts per filter.
   */
  bullion(params: {
    metal?: 'gold' | 'silver' | 'platinum' | 'palladium';
    form?: 'bullion_coin' | 'bar' | 'round';
    size?: string;
    brand?: string;
    sort?: 'popular' | 'premium' | 'per_oz' | 'price_low' | 'price_high';
    page?: number;
  } = {}) {
    return this.http.request<{ data: JsonObject[]; meta?: JsonObject }>({
      method: 'GET',
      path: '/v1/market/bullion',
      query: params,
    });
  }

  /**
   * The scrap calculator: melt value at spot and the best standing offer for
   * raw metal by weight and purity. Give `karat` (gold) or `finenessPpm`
   * (916700 = .9167). Units: ozt (troy), g, kg, dwt (pennyweight), tola.
   */
  scrapQuote(params: {
    metal: 'gold' | 'silver' | 'platinum' | 'palladium';
    weight: number;
    unit?: 'ozt' | 'g' | 'kg' | 'dwt' | 'tola';
    karat?: number;
    finenessPpm?: number;
  }) {
    return this.http.request<{ data: JsonObject }>({
      method: 'GET',
      path: '/v1/market/scrap/quote',
      query: params,
    });
  }

  /** Every (condition, grade) tier with activity, best grade first. */
  tiers(variantId: string) {
    return this.http.request<{ data: MarketTier[] }>({
      method: 'GET',
      path: `/v1/market/variants/${encodeURIComponent(variantId)}/tiers`,
    });
  }

  /**
   * Order-book depth for ONE tier.
   *
   * Omit `gradeKey` for the ungraded tier — that is where every order sits
   * unless a grading company certified the copy.
   */
  book(variantId: string, params: { condition?: string; gradeKey?: string } = {}) {
    return this.http.request<{
      data: {
        condition: string;
        gradeKey: string | null;
        bids: MarketBookLevel[];
        asks: MarketBookLevel[];
      };
    }>({
      method: 'GET',
      path: `/v1/market/variants/${encodeURIComponent(variantId)}/book`,
      query: params,
    });
  }

  /**
   * The grading companies and the grades each one issues.
   *
   * Worth fetching before building a tier query: the vocabularies differ per
   * company and per vertical, and asking for a grade a company does not issue
   * returns an empty book with nothing to explain why.
   */
  graders(params: { categorySlug?: string } = {}) {
    return this.http.request<{ data: MarketGrader[] }>({
      method: 'GET',
      path: '/v1/market/graders',
      query: params,
    });
  }
}
