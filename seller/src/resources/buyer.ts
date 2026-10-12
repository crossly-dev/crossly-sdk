import type { HttpClient, IdempotencyOpts } from './_shared.js';
import { BuyerGiftCardsResource } from './buyer/gift-cards.js';
import {
  BuyerGiftFinderResource, BuyerListingInsightsResource, BuyerSubscriptionsResource, BuyerSplitsResource,
  BuyerHuntsResource, BuyerGroupBuysResource, BuyerReturnsResource, BuyerBuybacksResource, BuyerTogetherResource,
} from './buyer/xmarket.js';
import {
  BuyerPurchaseExtrasResource, BuyerFitResource, BuyerBreaksResource, BuyerRoomResource, BuyerDiscoverMoreResource, BuyerMarketResource,
} from './buyer/xmarket-extras.js';
import { BuyerDeliveryResource, type PickupPoint } from './buyer/delivery.js';
import { BuyerCartOptimizerResource, BuyerInstantOffersResource, BuyerCollectionSetsResource } from './buyer/basket-sell.js';
import { BuyerVaultResource } from './buyer/vault.js';
import { BuyerPacksResource } from './buyer/packs.js';
import { BuyerAudioSummariesResource } from './buyer/audio-summaries.js';
import { BuyerProtectionPlansResource, BuyerUsdcResource } from './buyer/protection-plans.js';
import { BuyerTryOnResource } from './buyer/try-on.js';
import { BuyerPassportsResource } from './passports.js';
import { BuyerLiveShowsResource } from './live-shows.js';
import { BuyerBoardsResource, BuyerClubsResource, BuyerFriendsResource, BuyerLooksResource } from './buyer/friends-boards-clubs.js'; import { BuyerLayawaysResource, BuyerPricingResource, BuyerRegistriesResource, BuyerRentalsResource, BuyerVideoRequestsResource } from './buyer/wave3.js'; import { BuyerSizeMemoryResource } from './buyer/size-memory.js';
import type {
  Availability,
  BuyResult,
  CatalogItem,
  CatalogSearchParams,
  CheckoutControls,
  LandedCostQuote,
  ListingDetail,
  ListingShipping,
  Monitor,
  MonitorKind,
  MonitorMatch,
} from './buyer/types.js';
import type {
  AnywhereResult,
  LockonState,
  ScanResult,
  ScanSession,
  ScanSessionDetail,
} from './buyer/live-shop.js';
import { BuyerOffersResource, BuyerAuctionsResource } from './buyer/commerce.js';
import { BuyerOrdersResource, BuyerCasesResource, BuyerFeedbackResource } from './buyer/after-purchase.js';
import {
  BuyerSavedForLaterResource,
  BuyerTotalRequestsResource,
  BuyerWishlistsResource,
  BuyerHistoryResource,
  BuyerFollowingResource,
} from './buyer/lists.js';
import { BuyerBrowseResource, BuyerAccountResource } from './buyer/discover.js';

/**
 * The buyer surface — catalogue, monitors, and checkout.
 *
 * ── A DIFFERENT PRINCIPAL ────────────────────────────────────────────
 * Everything here needs a BUYER token (`crossly_oat_…`, scoped `buyer:*`), not
 * a seller Personal Access Token. The two are separate on purpose: a seller
 * PAT authenticating buyer calls would mean one credential that can both list
 * items in a shop and spend money in it.
 *
 * ── AND A DIFFERENT SET OF HABITS ────────────────────────────────────
 * These are the calls people otherwise get by scraping, so they are built for
 * the traffic shape scraping produces:
 *
 *   - `search` paginates by opaque CURSOR. Page 500 costs what page 1 costs.
 *     Do not parse a cursor; it is deliberately not a stable format.
 *   - Responses carry ETags. Send `If-None-Match` and an unchanged page
 *     answers 304 with no body — which is what makes polling cheap enough to
 *     be an honest option.
 *   - If you find yourself polling on a timer, use a MONITOR instead. It is
 *     cheaper for us by an enormous factor and lower-latency for you.
 *
 * ── WHERE THE TYPES LIVE ─────────────────────────────────────────────
 * The response shapes moved to `./buyer/types.js` (catalogue, monitors,
 * checkout) and `./buyer/live-shop.js` (scan, lock-on, HUD) to keep this file
 * under the repo's size cap. They are re-exported below, so
 * `import type { CatalogItem } from '@crossly/sdk'` is unchanged and so is
 * every method on the class.
 */

/** Units of each currency per 1 USD (display only — charges are USD). */
export interface FxRates {
  base: 'USD';
  asOf: string | null;
  rates: { [currency: string]: number };
}

export type {
  CatalogItem, CatalogSearchParams, ListingDetail, Availability, MonitorKind, Monitor, MonitorMatch, CheckoutControls, BuyResult, ListingShipping, ShippingServiceOption, LandedCostQuote,
} from './buyer/types.js';

export type {
  ScanTier, LockonCandidate, HudFact, HudAction, HudCoupon, Hud, ScanResult, ScanSession, LockonState, OfferCoupon, AnywhereResult, ScanSessionDetail,
} from './buyer/live-shop.js';

// The after-purchase / lists / browse surface, composed onto BuyerResource
// below. Re-exported so `import { BuyerOffer } from '@crossly/sdk'` works.
export * from './buyer/commerce.js';
export * from './buyer/after-purchase.js';
export * from './buyer/lists.js';
export * from './buyer/discover.js';
export * from './buyer/gift-cards.js';
export * from './buyer/xmarket.js';
export * from './buyer/xmarket-extras.js';
export * from './buyer/delivery.js';

export interface SellerTrust {
  memberSince: string | null;
  sales: number;
  rating: { average: number; count: number } | null;
  handlingDays: number | null;
  disputeRatePct: number | null;
  tier: string;
  badges: string[];
  lastActiveDays: number | null;
  summary: string[];
}

export class BuyerResource {
  // ── Sub-resources ──────────────────────────────────────────────────
  // Grouped by what the buyer is doing rather than flattened onto this class,
  // which is already the catalogue + monitors + checkout + Live Shop surface.
  /** Offers you made; answer a seller's counter. */
  readonly offers: BuyerOffersResource;
  /** Auctions you are in. `bid` SPENDS MONEY if you win. */
  readonly auctions: BuyerAuctionsResource;
  /** Act on an order: eligibility, cancel, received, not-received, export, report. */
  readonly orders: BuyerOrdersResource;
  /** The resolution center. */
  readonly cases: BuyerCasesResource;
  /** Feedback owed and left. */
  readonly feedback: BuyerFeedbackResource;
  readonly savedForLater: BuyerSavedForLaterResource;
  readonly totalRequests: BuyerTotalRequestsResource;
  /** Wishlist management (rename, share, delete, remove items). */
  readonly wishlists: BuyerWishlistsResource;
  /** Recently viewed. */
  readonly history: BuyerHistoryResource;
  /** Sellers you follow. */
  readonly following: BuyerFollowingResource;
  /** Browse with the shop's filters, seller search, sold history. */
  readonly browse: BuyerBrowseResource;
  /** Account badge counts. */
  readonly account: BuyerAccountResource;

  constructor(private http: HttpClient) {
    // Assigned here, not as field initialisers: with define-semantics class
    // fields an initialiser runs before the `http` parameter property is set.
    this.offers = new BuyerOffersResource(http);
    this.auctions = new BuyerAuctionsResource(http);
    this.orders = new BuyerOrdersResource(http);
    this.cases = new BuyerCasesResource(http);
    this.feedback = new BuyerFeedbackResource(http);
    this.savedForLater = new BuyerSavedForLaterResource(http);
    this.totalRequests = new BuyerTotalRequestsResource(http);
    this.wishlists = new BuyerWishlistsResource(http);
    this.history = new BuyerHistoryResource(http);
    this.following = new BuyerFollowingResource(http);
    this.browse = new BuyerBrowseResource(http);
    this.account = new BuyerAccountResource(http);
  }

  /**
   * Gift cards — buy (returns a PaymentIntent to confirm) and redeem.
   * A getter, so it needs no constructor wiring. See `./buyer/gift-cards.ts`.
   */
  get giftCards(): BuyerGiftCardsResource {
    return new BuyerGiftCardsResource(this.http);
  }

  // Cross-marketplace buyer features (./buyer/xmarket.ts) — getters, like giftCards.
  /** Gift finder: recipient, interest, budget → live listings. */
  get giftFinder(): BuyerGiftFinderResource { return new BuyerGiftFinderResource(this.http); }
  /** Fit, resale value, impact, bought-together, reviews, quick questions, breaks, group buy for one listing. */
  get listingInsights(): BuyerListingInsightsResource { return new BuyerListingInsightsResource(this.http); }
  /** Subscribe & save standing orders. */
  get subscriptions(): BuyerSubscriptionsResource { return new BuyerSubscriptionsResource(this.http); }
  /** Split a purchase into pay links. */
  get splits(): BuyerSplitsResource { return new BuyerSplitsResource(this.http); }
  /** The buyer agent: notify, offer or buy when a match appears. */
  get hunts(): BuyerHuntsResource { return new BuyerHuntsResource(this.http); }
  /** Group buys: the more who join, the lower the price. */
  get groupBuys(): BuyerGroupBuysResource { return new BuyerGroupBuysResource(this.http); }
  /** Returns under the seller's policy, and try at home. */
  get returns(): BuyerReturnsResource { return new BuyerReturnsResource(this.http); }
  /** Buyback guarantees. */
  get buybacks(): BuyerBuybacksResource { return new BuyerBuybacksResource(this.http); }
  /** Cart optimizer: the cheapest delivered basket for a shopping list. */
  get cartOptimizer(): BuyerCartOptimizerResource { return new BuyerCartOptimizerResource(this.http); }
  /** Instant offers on your collection: top bid + Crossly's store-credit offer. */
  get instantOffers(): BuyerInstantOffersResource { return new BuyerInstantOffersResource(this.http); }
  /** Set completion from your collection, and set leaderboards. */
  get collectionSets(): BuyerCollectionSetsResource { return new BuyerCollectionSetsResource(this.http); }
  /** Your Crossly vault: authenticated items stored for you — sell without shipping, or ship home. */
  get vault(): BuyerVaultResource { return new BuyerVaultResource(this.http); }
  /** Packs with published odds; provably-fair pulls into your vault, sell-back for credit. */
  get packs(): BuyerPacksResource { return new BuyerPacksResource(this.http); }
  /** Spoken listing summaries (accessibility): grounded text + its recording. */
  get audioSummaries(): BuyerAudioSummariesResource { return new BuyerAudioSummariesResource(this.http); }
  /** Extended warranties bought at checkout: list, cancel for the insurer's refund. */
  get protectionPlans(): BuyerProtectionPlansResource { return new BuyerProtectionPlansResource(this.http); }
  /** AI try-on of a wearable on the buyer's own photo. */
  get tryOn(): BuyerTryOnResource { return new BuyerTryOnResource(this.http); }
  /** Paying with USDC: availability, networks and the per-order limit. */
  get usdc(): BuyerUsdcResource { return new BuyerUsdcResource(this.http); }
  /** Product passports: what a tag opens; claim one as the item's current owner. */
  get passports(): BuyerPassportsResource { return new BuyerPassportsResource(this.http); }
  /** Live shows: lineups, "sold here" replay moments, one box per show, gifts sent. */
  get liveShows(): BuyerLiveShowsResource { return new BuyerLiveShowsResource(this.http); }
  /** Friends in your chats and shared wishlists. */
  get friends(): BuyerFriendsResource { return new BuyerFriendsResource(this.http); }
  /** Outfit boards: collages of listings, shareable. */
  get boards(): BuyerBoardsResource { return new BuyerBoardsResource(this.http); }
  /** Shop the look: listings tagged on story and lookbook photos. */
  get looks(): BuyerLooksResource { return new BuyerLooksResource(this.http); }
  /** Sellers' loyalty clubs: tiers, your standing, join and leave. */
  get clubs(): BuyerClubsResource { return new BuyerClubsResource(this.http); } /** Own-price match + price protection. */ get pricing(): BuyerPricingResource { return new BuyerPricingResource(this.http); } /** Ask sellers for videos. */ get videos(): BuyerVideoRequestsResource { return new BuyerVideoRequestsResource(this.http); } /** Gift registries. */ get registries(): BuyerRegistriesResource { return new BuyerRegistriesResource(this.http); } /** Layaway. */ get layaways(): BuyerLayawaysResource { return new BuyerLayawaysResource(this.http); } /** Rent instead of buy. */ get rentals(): BuyerRentalsResource { return new BuyerRentalsResource(this.http); } /** Size memory: your size, learned from what you kept. */ get sizeMemory(): BuyerSizeMemoryResource { return new BuyerSizeMemoryResource(this.http); }
  /** Shop-together rooms. */
  get together(): BuyerTogetherResource { return new BuyerTogetherResource(this.http); }
  /** Subscribe offer, footprint, buybacks, splits, return quotes, owner stories, downloads. */
  get purchaseExtras(): BuyerPurchaseExtrasResource { return new BuyerPurchaseExtrasResource(this.http); }
  /** Saved reference garments for fit comparison. */
  get fit(): BuyerFitResource { return new BuyerFitResource(this.http); }
  /** Card breaks you are in; hold a pick-your-spot spot. */
  get breaks(): BuyerBreaksResource { return new BuyerBreaksResource(this.http); }
  /** One shop-together room: board, votes, chat. */
  get room(): BuyerRoomResource { return new BuyerRoomResource(this.http); }
  /** Parties, the price guide, creator storefronts. */
  get discoverMore(): BuyerDiscoverMoreResource { return new BuyerDiscoverMoreResource(this.http); }
  /** Market watches and fixed-price bids. */
  get market(): BuyerMarketResource { return new BuyerMarketResource(this.http); }
  /** Pickup points, where a purchase is going, ship-together consolidations. */
  get delivery(): BuyerDeliveryResource { return new BuyerDeliveryResource(this.http); }

  // ── Catalogue ──────────────────────────────────────────────────────

  /**
   * Search the catalogue. Requires `buyer:catalog:read`.
   *
   * `meta.nextCursor` is the next page; absent when the walk is done.
   */
  search(params: CatalogSearchParams = {}) {
    return this.http.request<{ data: CatalogItem[]; meta?: { nextCursor: string | null } }>({
      method: 'GET',
      path: '/v1/buyer/catalog/search',
      query: params as Record<string, unknown>,
    });
  }

  /** One listing, in full. Resolves even when sold or delisted. */
  /**
   * Seller at a glance: member since, completed sales, independent rating,
   * typical handling time, dispute rate, trust tier, badges, and `summary` —
   * the plain sentences the shop profile shows. Recorded facts only.
   */
  sellerTrust(username: string) {
    return this.http.request<{ data: SellerTrust }>({
      method: 'GET',
      path: `/v1/buyer/sellers/${encodeURIComponent(username)}/trust`,
    });
  }

  getListing(slug: string) {
    return this.http.request<ListingDetail>({
      method: 'GET',
      path: `/v1/buyer/catalog/listings/${encodeURIComponent(slug)}`,
    });
  }

  /**
   * Is it buyable, and at what price.
   *
   * The cheapest call in the API, and the one to poll if you are going to
   * poll — one indexed row and an ETag. A monitor is still better.
   */
  availability(slug: string) {
    return this.http.request<Availability>({
      method: 'GET',
      path: `/v1/buyer/catalog/listings/${encodeURIComponent(slug)}/availability`,
    });
  }

  /**
   * Every shipping service (Standard / Expedited / international) the seller
   * offers to a destination, priced for `quantity`. `zip` is required for a
   * domestic quote. Pass a service `id` as `shippingServiceId` to `buy()`.
   */
  shipping(slug: string, params: { zip?: string; country?: string; quantity?: number } = {}) {
    return this.http.request<ListingShipping>({
      method: 'GET',
      path: `/v1/buyer/catalog/listings/${encodeURIComponent(slug)}/shipping`,
      query: params as Record<string, unknown>,
    });
  }

  /**
   * Import duties, taxes and fees to `country` (ISO-2), and whether checkout
   * charges them (DDP) or they are due on delivery (DDU). Throws a 503
   * (`missingEnv`) where landed-cost quoting is not configured.
   */
  landedCost(slug: string, params: { country: string; postalCode?: string; quantity?: number }) {
    return this.http.request<LandedCostQuote>({
      method: 'GET',
      path: `/v1/buyer/listings/${encodeURIComponent(slug)}/landed-cost`,
      query: params as Record<string, unknown>,
    });
  }

  /** Brands, categories and conditions that currently have stock. */
  facets() {
    return this.http.request<{
      brands: { value: string; count: number }[];
      conditions: { value: string; count: number }[];
      categories: { value: string; count: number }[];
    }>({ method: 'GET', path: '/v1/buyer/catalog/facets' });
  }

  /**
   * Display-only exchange rates: units of each currency per 1 USD, from the
   * European Central Bank's daily reference rates. For showing an
   * approximate price ("≈ €42.10") — every charge is in US dollars.
   * Requires `buyer:catalog:read`.
   */
  fxRates() {
    return this.http.request<FxRates>({
      method: 'GET',
      path: '/v1/buyer/catalog/fx',
    });
  }

  // ── Monitors ───────────────────────────────────────────────────────

  /** Your monitors. Requires `buyer:monitors:read`. */
  listMonitors() {
    return this.http.request<{ data: Monitor[] }>({
      method: 'GET',
      path: '/v1/buyer/monitors',
    });
  }

  /**
   * Watch a search. Requires `buyer:monitors:write`.
   *
   * Works immediately — there is no review step. Two things worth knowing:
   *
   *   - `webhookSecret` comes back HERE and nowhere else.
   *   - The first sweep SEEDS without notifying. A restock alert created while
   *     the item is in stock has not observed a restock, and a new-listing
   *     monitor would otherwise deliver the entire back catalogue at once.
   *
   * `back_in_stock` must name one listing via `query.slug`.
   */
  createMonitor(input: {
    name: string;
    kind: MonitorKind;
    query?: Record<string, unknown>;
    delivery?: 'webhook' | 'poll';
    webhookUrl?: string;
  }) {
    return this.http.request<Monitor>({
      method: 'POST',
      path: '/v1/buyer/monitors',
      body: input,
    });
  }

  /**
   * What a monitor has matched.
   *
   * The read side of a `poll` monitor, and an audit trail for a `webhook` one
   * — a delivery you missed is not data you lost.
   */
  monitorMatches(id: string) {
    return this.http.request<{ data: MonitorMatch[] }>({
      method: 'GET',
      path: `/v1/buyer/monitors/${encodeURIComponent(id)}/matches`,
    });
  }

  /** Pause, resume or rename. Resuming clears a delivery-failure pause. */
  updateMonitor(id: string, patch: { name?: string; active?: boolean }) {
    return this.http.request<Monitor>({
      method: 'PATCH',
      path: `/v1/buyer/monitors/${encodeURIComponent(id)}`,
      body: patch,
    });
  }

  /** Delete a monitor. Answers 204. */
  deleteMonitor(id: string) {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/v1/buyer/monitors/${encodeURIComponent(id)}`,
    });
  }


  // ── Where is this cheapest, anywhere ───────────────────────────────

  /**
   * Cheapest source for an item — Crossly first, then other retailers.
   *
   * Offsite offers are ranked CHEAPEST-FIRST; commission only ever breaks a
   * sub-$1 tie, and Crossly gets a $1 preference and no more. Check
   * `shippingUnknown` before presenting a total as delivered.
   */
  anywhere(params: {
    ns: string;
    value: string;
    pagePriceCents?: number;
    currency?: string;
  }) {
    return this.http.request<AnywhereResult>({
      method: 'GET',
      path: '/v1/buyer/anywhere',
      query: params as Record<string, unknown>,
    });
  }

  // ── Live Shop ──────────────────────────────────────────────────────

  /**
   * Identify a held object and get a HUD-ready answer.
   *
   * A decoded BARCODE resolves in ~50ms for nothing. A photo falls back to
   * self-hosted CLIP, then to a vision model (capped per buyer per day).
   * A vision label names the thing; it never drives a price comparison.
   */
  identify(input: {
    identifier?: { ns: string; value: string };
    imageBase64?: string;
    pagePriceCents?: number;
    currency?: string;
    sessionId?: string;
    /** Opt out of the one rung that costs money. */
    allowVision?: boolean;
  }) {
    return this.http.request<ScanResult>({
      method: 'POST',
      path: '/v1/buyer/identify',
      body: input,
    });
  }

  /** One-shot scan. Prefer `identify` — it runs the full cost ladder. */
  scan(input: {
    identifier?: { ns: string; value: string };
    imageBase64?: string;
    pagePriceCents?: number;
    currency?: string;
    sessionId?: string;
  }) {
    return this.http.request<ScanResult>({
      method: 'POST',
      path: '/v1/buyer/scan',
      body: input,
    });
  }

  /** Open a shopping trip. Opening one CLOSES any other live session. */
  startScanSession(input: { device?: 'glasses' | 'phone'; label?: string } = {}) {
    return this.http.request<ScanSession>({
      method: 'POST',
      path: '/v1/buyer/scan/sessions',
      body: input,
    });
  }

  endScanSession(id: string) {
    return this.http.request<ScanSession>({
      method: 'POST',
      path: `/v1/buyer/scan/sessions/${encodeURIComponent(id)}/end`,
    });
  }

  listScanSessions() {
    return this.http.request<{ data: ScanSession[] }>({
      method: 'GET',
      path: '/v1/buyer/scan/sessions',
    });
  }

  /** One trip and everything it found. Verdicts are as-given, never re-priced. */
  getScanSession(id: string) {
    return this.http.request<ScanSessionDetail>({
      method: 'GET',
      path: `/v1/buyer/scan/sessions/${encodeURIComponent(id)}`,
    });
  }

  // ── Lock-on ────────────────────────────────────────────────────────

  /** Lock on to an object the buyer is holding. */
  startLockon(input: { sessionId: string }) {
    return this.http.request<{ id: string; status: string }>({
      method: 'POST',
      path: '/v1/buyer/lockons',
      body: input,
    });
  }

  /**
   * Add what a frame revealed, and get the current best answer.
   *
   * Send only what you LEARNED — a decoded barcode, newly-read OCR text, or a
   * frame when neither settled it. Do NOT post every frame: tracking and
   * decoding are on-device and free, and this endpoint is for evidence, not
   * video. Evidence is ranked, so a late weak reading cannot overwrite a
   * strong early one.
   */
  observeLockon(
    id: string,
    input: {
      barcode?: { ns: string; value: string };
      ocrText?: string;
      attributes?: {
        brand?: string;
        model?: string;
        size?: string;
        colour?: string;
        tokens?: string[];
      };
      imageBase64?: string;
      pagePriceCents?: number;
      currency?: string;
    },
  ) {
    return this.http.request<LockonState>({
      method: 'POST',
      path: `/v1/buyer/lockons/${encodeURIComponent(id)}/observe`,
      body: input,
    });
  }

  /**
   * The buyer picked a candidate.
   *
   * Promotes a text match to a CONFIRMED identity — validated against the
   * candidates actually offered, so it cannot be claimed about an arbitrary
   * product.
   */
  confirmLockon(id: string, input: { ns: string; value: string }) {
    return this.http.request<LockonState>({
      method: 'POST',
      path: `/v1/buyer/lockons/${encodeURIComponent(id)}/confirm`,
      body: input,
    });
  }

  // ── Checkout ───────────────────────────────────────────────────────

  /** What THIS key may spend. Per-key, not per-account. */
  checkoutControls() {
    return this.http.request<CheckoutControls>({
      method: 'GET',
      path: '/v1/buyer/checkout/controls',
    });
  }

  /**
   * Switch this key on for spending and set its ceilings.
   *
   * Holding `buyer:checkout:write` is NOT sufficient on its own — a key that
   * was never deliberately enabled here cannot spend, which is what bounds the
   * damage a leaked token can do.
   */
  setCheckoutControls(controls: {
    enabled: boolean;
    dailyLimitCents: number;
    perOrderLimitCents: number;
    maxUnitsPerListingPerDay: number;
  }) {
    return this.http.request<CheckoutControls>({
      method: 'PUT',
      path: '/v1/buyer/checkout/controls',
      body: controls,
    });
  }

  /**
   * Buy a listing without being present. Requires `buyer:checkout:write`.
   *
   * AN IDEMPOTENCY KEY IS REQUIRED — the API refuses without one (400
   * `idempotency_key_required`), not merely this client. A retry after a
   * timeout is the normal way an automated buyer buys the same thing twice,
   * and it happens in exactly the case where you never learn the first attempt
   * succeeded.
   *
   * Derive it from the INTENT and reuse it across retries. A fresh random value
   * per attempt satisfies the requirement and keeps the bug.
   *
   * `maxTotalCents` is checked against the DELIVERED total (item + shipping +
   * tax) before anything is charged, not against the sticker price.
   *
   * `paymentMethodId` names a card you already saved on crossly.net. There is
   * no field for card data anywhere in this API.
   *
   * A card that demands 3-D Secure cannot be charged unattended: that answers
   * 402 `authentication_required` rather than pretending to succeed.
   */
  buy(
    input: {
      listingSlug: string;
      paymentMethodId: string;
      quantity?: number;
      shipTo?: {
        name: string;
        street1: string;
        street2?: string;
        city: string;
        /** Required where the country needs one (US, CA, AU, …); see `reference.countries()`. */
        state?: string;
        /** Required where the country has postal codes (US ZIP, UK postcode, …); omit for HK, AE. */
        zip?: string;
        /** ISO 3166-1 alpha-2. Defaults to US. */
        country?: string;
      };
      localPickup?: boolean;
      maxTotalCents?: number;
      /** 'direct' skips a seller-required authentication on an eligible item; 'add' buys one. */
      authentication?: 'direct' | 'add';
      /** A protection plan id from the quote's `protectionOptions`; its premium is added to the charge. */
      protectionPlanId?: string;
      /** Send it as a gift: the recipient is emailed a teaser (no price) and it is revealed on delivery. */
      gift?: { recipientName: string; recipientEmail: string; message?: string; teaserAt?: string; senderName?: string };
      /** A service id from `shipping()`; default the cheapest. */
      shippingServiceId?: string;
      /** Hold it at a carrier pickup point from `buyer.delivery.pickupPoints()`; wins over shippingServiceId. */
      pickupPoint?: PickupPoint;
      /**
       * Pay in this currency (ISO 4217, e.g. 'eur') at the rate quoted inside
       * the request, incl. a 3% conversion charge. Limits stay USD cents.
       * 422 `currency_unavailable` when it cannot be honoured (e.g. pre-orders).
       */
      payInCurrency?: string;
    },
    opts?: IdempotencyOpts,
  ) {
    return this.http.request<BuyResult>({
      method: 'POST',
      path: '/v1/buyer/checkout',
      body: input,
      idempotencyKey: opts?.idempotencyKey,
    });
  }
}
