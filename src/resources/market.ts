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

  getProduct(id: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/market/products/${encodeURIComponent(id)}`,
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
