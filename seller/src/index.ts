/**
 * @crossly/sdk — official TypeScript client for the Crossly public API.
 *
 *   import { createClient } from '@crossly/sdk';
 *
 *   const crossly = createClient({ pat: process.env.CROSSLY_PAT! });
 *
 *   const { data: items } = await crossly.inventory.list({ status: 'active' });
 *   await crossly.listings.create({
 *     inventoryItemId: items[0].id,
 *     platforms: ['poshmark', 'mercari', 'depop'],
 *     priceOverrides: { poshmark: 48 },
 *   });
 *
 * Works in Node 18+, modern browsers (with the standard `Authorization`
 * header), Cloudflare Workers (`createClient({ pat, fetch })`), Deno, Bun.
 * Auth is via Personal Access Token — mint one at
 * https://crossly.net/settings under Personal Access Tokens.
 *
 * Errors surface as `CrosslyAPIError` with a stable `code`, the http
 * `status`, and the server's `message`/`details`.
 */
export { verifyWebhook, WebhookVerificationError } from './webhooks.js';
export type { WebhookEvent, VerifyOptions } from './webhooks.js';
export { CrosslyAPIError, CrosslyConfigError } from './errors.js';
export type { CrosslyErrorPayload } from './errors.js';
export type { ClientConfig, RequestOptions, QueryParams } from './client.js';
export type { PaginationParams, Paginated, Platform, JsonObject } from './types.js';
export type { BrandDrop, BrandDropCreate, BrandDropUpdate, BrandDropStatus, BrandDropListing, BrandDropPartner, BrandDropPartnerSummary } from './resources/brand-drops.js';
export type { StorefrontShipping, StorefrontShippingPolicy, StorefrontShippingUpdate, ShipFromAddressInput, ListingCustoms, ListingCustomsUpdate } from './resources/storefront-shipping.js';
export type { BuyerProfile, CustomerStats, CustomerDetail, CustomerListRow, CustomerBestRating, CustomerProfileRefresh } from './resources/customers-types.js';

import { HttpClient, type ClientConfig } from './client.js';
import {
  InventoryResource,
  ListingsResource,
  OrdersResource,
  SalesResource,
  InboxResource,
  AnalyticsResource,
  AccountsResource,
  MembershipResource,
  ConnectedAppsResource,
  AutomationResource,
  WorkflowsResource,
  NotificationsResource,
  NetworkResource,
  TaxonomyResource,
  CatalogLookupResource,
  MarketResource,
  EmbedsResource,
  BuyerResource,
  ScanResource,
  WebhooksResource,
  TemplatesResource,
  ImportsResource,
  ReturnsResource,
  CustomersResource,
  ReferenceResource,
  AIResource,
  TaxResource,
  ProfileResource,
  ConnectionsResource,
  PatResource,
  MagicResource,
  CompWatchlistsResource,
  RestockPromptsResource,
  SavedViewsResource,
  MobileResource,
  TeamResource,
  AccountResource,
  SourcingResource,
  ActionLogResource,
  OffersResource,
  TradeBlockResource,
  BreaksResource,
  GroupBuysResource,
  PolicyReturnsResource,
  ProductionResource,
  GradingResource,
  StallsResource,
  NeighbourhoodsResource,
  HomesResource,
  ReputationResource,
  WorldLiveResource,
  DropsResource,
  SpatialEmotesResource,
  SpatialPartyResource,
  GamesResource,
  WorldResource,
  WorldPlacesResource,
  WorldConventionsResource,
  SpatialRoomsResource,
  WorldCreatorResource,
  WorldCapabilitiesResource,
  WorldContestsResource,
  WorldGamesResource,
  WorldAccountResource,
  WorldStreetsResource,
  WorldSpacesResource,
  WorldPartiesResource,
  WorldHomesResource,
  WorldHuntResource, WorldTrialsResource, WorldArcadeResource, WorldWishesResource, WorldChestsResource, WorldFirefliesResource, WorldLanternsResource, WorldKitesResource, WorldHallResource, WorldAuroraResource, WorldGrailsResource, WorldProvenanceResource,
  NftMarketResource,
  Web3Resource,
  PolicyPresetsResource, StorefrontShippingResource, CatalogMatchesResource, BrandDropsResource,
  DevicesResource,
  PayoutResource,
  VariationGroupsResource,
  PassportsResource,
  LiveShowsResource,
  LoyaltyResource,
  HotspotsResource, PricingResource,
  VideoRequestsResource, RentalsResource, UnitsResource, EvidenceResource,
  SpatialResource, SpatialAuctionResource, SpatialEmployeeResource,
  WholesaleResource, VaultMarketsResource,
  CbxResource,
  AdsResource,
  CosmResource,
  DaoResource,
  CbxAdsResource,
  CbxCreditResource,
  CbxRewardsResource,
  CbxStakingResource,
  CbxWalletPaymentsResource,
} from './resources.js';
export type { ActionLogListParams, PolicyPreset, PolicyPresetKind, PolicyPresetCreate, PolicyPresetUpdate } from './resources.js';
export type { CaptureVerdict, SealVerdict, ArrivalState, WholesaleLine } from './resources.js';
export type * from './resources/vault-markets.js';
export type * from './resources/vault-markets-pro.js';
export type {
  AIImageStyle,
  AIImageProvider,
  ListingImagePromptBody,
  GenerateListingImageBody,
  ListingImagePrompt,
  GeneratedListingImage,
  AIImageConfigBody,
  AIImageConfigResult,
} from './resources.js';
export type {
  GradingRun,
  GradingRate,
  GradingSubmission,
  GradingSubmissionStatus,
  GradingWorth,
  ReserveGradingSlotBody,
  CreateDirectGradingBody,
  DirectGradingResultBody,
  CertLookup,
} from './resources.js';
export type {
  Neighbourhood,
  NeighbourhoodSlug,
  StreetStall,
  StallListing,
  FreeStallSpot,
  StreetEvent,
  StallQuote,
  StallBooking,
  BookStallBody,
  UpdateStallBody,
  QuoteStallParams,
  StallRail,
  StallAwning,
  MomentKind,
  MomentPayload,
  Moment,
  EmotePack,
  WheelEntry,
  MyEmotes,
} from './resources.js';
export type {
  InventoryUnit,
  UnitIdentifier,
  UnitIdNamespace,
  UnitIdSource,
  IdentityStrength,
  RecordIdentifierBody,
} from './resources.js';

export {
  InventoryResource,
  ListingsResource,
  OrdersResource,
  SalesResource,
  InboxResource,
  AnalyticsResource,
  AccountsResource,
  MembershipResource,
  ConnectedAppsResource,
  AutomationResource,
  WorkflowsResource,
  NotificationsResource,
  NetworkResource,
  TaxonomyResource,
  WebhooksResource,
  TemplatesResource,
  ImportsResource,
  ReturnsResource,
  CustomersResource,
  ReferenceResource,
  AIResource,
  TaxResource,
  ProfileResource,
  ConnectionsResource,
  PatResource,
  MagicResource,
  CompWatchlistsResource,
  RestockPromptsResource,
  SavedViewsResource,
  MobileResource,
  TeamResource,
  AccountResource,
  SourcingResource,
  ActionLogResource,
  OffersResource,
  TradeBlockResource,
  BreaksResource,
  GroupBuysResource,
  PolicyReturnsResource,
  ProductionResource,
  GradingResource,
  StallsResource,
  NeighbourhoodsResource,
  HomesResource,
  ReputationResource,
  WorldLiveResource,
  DropsResource,
  SpatialEmotesResource,
  SpatialPartyResource,
  GamesResource,
  WorldResource,
  WorldPlacesResource,
  WorldConventionsResource,
  SpatialRoomsResource,
  WorldCreatorResource,
  WorldCapabilitiesResource,
  WorldContestsResource,
  WorldGamesResource,
  WorldAccountResource,
  WorldStreetsResource,
  WorldSpacesResource,
  WorldPartiesResource,
  WorldHomesResource,
  WorldHuntResource, WorldTrialsResource, WorldArcadeResource, WorldWishesResource, WorldChestsResource, WorldFirefliesResource, WorldLanternsResource, WorldKitesResource, WorldHallResource, WorldAuroraResource, WorldGrailsResource, WorldProvenanceResource,
  NftMarketResource,
  Web3Resource,
  PolicyPresetsResource, StorefrontShippingResource, CatalogMatchesResource, BrandDropsResource,
  DevicesResource,
  PayoutResource,
  VariationGroupsResource,
  PassportsResource,
  LiveShowsResource,
  LoyaltyResource,
  HotspotsResource, PricingResource,
  VideoRequestsResource, RentalsResource, UnitsResource, EvidenceResource,
  SpatialResource, SpatialAuctionResource, SpatialEmployeeResource,
  WholesaleResource, VaultMarketsResource, VaultMarketsProResource, VaultMarketsLiquidityResource,
  VaultMarketsCreditResource, VaultMarketsAnalyticsResource, VaultMarketsOpsResource, VaultMarketsGradingResource, VaultMarketsSocialResource,
  VaultMarketsSupplyResource, VaultMarketsChannelsResource, VaultMarketsStatsResource, VaultMarketsIndexResource, VaultMarketsTitleResource, VaultMarketsInstResource, VaultMarketsMmResource, VaultMarketsAdlResource, VaultMarketsCurvePoolsResource, VaultMarketsBullionResource, VaultMarketsP2pResource, VaultMarketsPmResource, VaultMarketsOracleDcmResource, VaultMarketsReceiptTokensResource, VaultMarketsWorldResource, VaultMarketsMarksResource, VaultMarketsGradeToVaultResource, VaultMarketsHallResource, VaultMarketsAgentResource, VaultMarketsPaperResource, VaultMarketsModeResource, VaultMarketsUnitStoryResource, VaultMarketsAlertsHubResource, VaultMarketsFollowsResource, VaultMarketsFloorResource, VaultMarketsSetGoalsResource, VaultMarketsValuationResource, VaultMarketsJointTodResource, VaultMarketsVaultSuggestResource, VaultMarketsHealthResource, VaultMarketsTaxLossResource, VaultMarketsHomeResource, VaultMarketsPriceWidgetsResource, VaultMarketsPopReportsResource, VaultMarketsWidgetResource,
} from './resources.js';

export interface CrosslyClient {
  inventory: InventoryResource;
  listings: ListingsResource;
  orders: OrdersResource;
  sales: SalesResource;
  inbox: InboxResource;
  analytics: AnalyticsResource;
  accounts: AccountsResource;
  membership: MembershipResource;
  connectedApps: ConnectedAppsResource;
  automation: AutomationResource;
  workflows: WorkflowsResource;
  notifications: NotificationsResource;
  network: NetworkResource;
  /**
   * Live Crossly offers for a barcode / style code / LEGO set number.
   *
   * The same lookup the buyer-side Scout extension runs — see the resource's
   * docblock. Needs the `catalog:read` scope.
   */
  catalog: CatalogLookupResource;
  /** The Crossly Market order book — public, read-only. */
  market: MarketResource;
  /** Publishable keys for the embeddable storefront. */
  embeds: EmbedsResource;
  /**
   * Catalogue, monitors and checkout.
   *
   * A DIFFERENT principal: these need a buyer token (`crossly_oat_…` scoped
   * `buyer:*`), not a seller PAT. One credential that could both run a shop
   * and spend money in one is not a credential anybody should have to hold.
   */
  buyer: BuyerResource;
  /** Camera scan → 3D. Any object, not a catalogue whitelist. */
  scan: ScanResource;
  taxonomy: TaxonomyResource;
  webhooks: WebhooksResource;
  templates: TemplatesResource;
  imports: ImportsResource;
  returns: ReturnsResource;
  customers: CustomersResource;
  reference: ReferenceResource;
  ai: AIResource;
  tax: TaxResource;
  profile: ProfileResource;
  connections: ConnectionsResource;
  pat: PatResource;
  magic: MagicResource;
  compWatchlists: CompWatchlistsResource;
  restockPrompts: RestockPromptsResource;
  savedViews: SavedViewsResource;
  mobile: MobileResource;
  team: TeamResource;
  /** Account lifecycle (deletion + auth sessions). Distinct from `accounts` (platform connections). */
  account: AccountResource;
  sourcing: SourcingResource;
  /** Action log — "what happened / what was sent / what went wrong" across marketplaces. */
  actionLog: ActionLogResource;
  /** Reusable return/shipping/payment policy presets. */
  offers: OffersResource;
  /** The Trade Block — peer-to-peer market swaps (post / offer / accept). */
  tradeBlock: TradeBlockResource;
  /** Card breaks on your listings. */
  breaks: BreaksResource;
  /** Group buys on your listings. */
  groupBuys: GroupBuysResource;
  /** Returns Crossly buyers open under your policy or try at home. */
  policyReturns: PolicyReturnsResource;
  production: ProductionResource;
  /** Crossly Grading: pooled Grading Runs, Direct submissions, cert lookups. */
  grading: GradingResource;
  /** Crossly World pop-up stalls: quote, book, dress and cancel; street stalls and events. */
  stalls: StallsResource;
  /** Crossly World neighbourhoods: the four streets by taste, open or opening soon. */
  neighbourhoods: NeighbourhoodsResource;
  /** Crossly World homes: yours, one by address, and the home of the week. */
  homes: HomesResource;
  /** Crossly World reputation levels (yours, anyone's public levels) and the Jobs board (open shifts, price checks). */
  reputation: ReputationResource;
  /** Crossly World pets (earned, never sold), the Main Stage and its programme, festivals. */ worldLive: WorldLiveResource;
  /** Crossly World public rooms by slug: offers, deals, drops, trades, collections, radar, trade tables. */ worldPlaces: WorldPlacesResource;
  /** Crossly World conventions: host, apply, invite, accept, leave; table fees recorded, never moved. */
  worldConventions: WorldConventionsResource;
  /** Your Crossly World rooms: invites, grants, pins, warehouse racks, cosmetics, shop layout. */
  spatialRooms: SpatialRoomsResource;
  /** The Crossly World creator API (world:create): interactive objects and decor designs, draft to review. */
  worldCreator: WorldCreatorResource;
  /** NFT capabilities in Crossly World: what your tokens unlock, and declaring what a collection's tokens can do. */
  worldCapabilities: WorldCapabilitiesResource;
  /** Skill contests on Crossly World games: list, standings, set one up, enter, settle a paid entry. */
  worldContests: WorldContestsResource;
  /** Crossly World game packages: the directory, submit a package, your packages, buy from a game store, your rewards. */
  worldGames: WorldGamesResource;
  /** You in Crossly World: unblock, job shifts, price-check answers, place bans, identity, fit-value sharing. */
  worldAccount: WorldAccountResource;
  /** Crossly World streets, street and stall decor, leases, neighbourhoods, room attention, the room catalogue. */
  worldStreets: WorldStreetsResource;
  /** Crossly World Spaces: the directory, joining, hosting, members and events. */
  worldSpaces: WorldSpacesResource;
  /** Crossly World party writes: start, invite, lead, wishlist, chat. */
  worldParties: WorldPartiesResource;
  /** Crossly World homes: your home settings and layout, co-building, guestbooks. */
  worldHomes: WorldHomesResource;
  /** The Great Hunt: your keys and riddles, the Scoreboard, and starting the hunt (keys are taken by walking to them in the world). */
  worldHunt: WorldHuntResource;
  /** The Wishing Fountain: everyone's wishes today and yours (a wish is made by tossing a coin in the world). */ worldWishes: WorldWishesResource;
  /** Fireflies on the Commons lawn: everyone's catches today and yours (a firefly is caught by walking up to it in the world). */ worldFireflies: WorldFirefliesResource;
  /** Sky lanterns in the Commons: everyone's today and yours (a lantern is released at the stand in the world). */ worldLanterns: WorldLanternsResource;
  /** Kites on the Commons lawn: everyone's today and yours (a kite is flown on the lawn in the world). */ worldKites: WorldKitesResource;
  /** The Hall of Grails: this week's exhibition of real catalogue items and their live order book. */ worldHall: WorldHallResource; /** The Sales Aurora: the month's sales over the Commons, aggregate. */ worldAurora: WorldAuroraResource; /** Grail glints: which ids are things you want. */ worldGrails: WorldGrailsResource; /** Provenance trails: where your purchases were found. */ worldProvenance: WorldProvenanceResource;
  /** The Commons chest: this window's and whether you opened it (opened by walking up to it in the world). */ worldChests: WorldChestsResource;
  /** Hoverboard Time Trials: your bests and each course's weekly + all-time boards (laps are timed by riding in the world). */
  worldTrials: WorldTrialsResource;
  /** The Arcade: its cabinets (which game each hosts) and the High Score wall. Games are played in the world. */ worldArcade: WorldArcadeResource;
  /** Crossly World drops: a fair draw at the shop door -- set up, read, join the line. */
  drops: DropsResource;
  /** Crossly World emotes, read-only: unlocked packs, the wheel, earned moments. */
  spatialEmotes: SpatialEmotesResource;
  /** Crossly World parties, read-only: your party, invites to you, the shared wishlist and its thumbs. */
  spatialParty: SpatialPartyResource;
  /** Crossly World market games: your results, live hunts, staged pack breaks (read-only). */
  games: GamesResource;
  /** Crossly World: wallet, quests, crew, wardrobe, COSM reads, friends, fit value, boards, auto-shop -- and the no-money verbs (pin, crews, invite, equip). */
  world: WorldResource;
  nftMarket: NftMarketResource;
  web3: Web3Resource;
  policyPresets: PolicyPresetsResource;
  /** "Is this the same product?" suggestions linking inventory to the catalog; confirm binds market_sku_id. */ catalogMatches: CatalogMatchesResource;
  /** Ship-from, which countries you ship to, and per-listing customs (HS code, origin, don't-ship-to). */ storefrontShipping: StorefrontShippingResource;
  /** Brand drops: an approved drop partner's promoted drop-day releases (create, schedule or submit for review, choose listings). */ brandDrops: BrandDropsResource;
  devices: DevicesResource;
  /** Net payout per platform — fees + shipping, and the inverse for floors. */
  payout: PayoutResource;
  /** Listings sold as one product with options. Members stay STANDALONE
   *  listings — they publish on their own where variations aren't supported,
   *  so don't treat membership as "not for sale by itself". */
  variationGroups: VariationGroupsResource;
  /** Product passports: NFC / QR tags on items that open their provenance. */
  passports: PassportsResource;
  /** Live shows: lineups, and one box per buyer per show. */
  liveShows: LiveShowsResource;
  /** Your loyalty club: spend tiers with discounts. */
  loyalty: LoyaltyResource;
  /** Shop-the-look tags on your story / lookbook photos. */
  hotspots: HotspotsResource;
  /** Own-price match setting. */
  pricing: PricingResource;
  /** Buyers asking for videos of your items. */
  videoRequests: VideoRequestsResource;
  /** Rent your listings out. */
  rentals: RentalsResource;
  /** Per-unit identity — serials/IMEIs, and the return check they enable. */
  units: UnitsResource;
  /** Packing video, seal comparison, arrival photos — the dispute bundle. */
  evidence: EvidenceResource;
  spatial: SpatialResource;
  /** The live auction house bound into a spatial room. DIGITAL GOODS ONLY —
   *  a physical lot is refused on every bid, not just at setup. */
  spatialAuction: SpatialAuctionResource;
  /** The per-room shop employee: its settings, and what it cost. There is no
   *  `engage` — an engagement opens a BILLABLE session and is emitted by the
   *  room, never by a program. */
  spatialEmployee: SpatialEmployeeResource;
  /** Volume + account pricing, with the steps that produced the number. */
  wholesale: WholesaleResource;
  /** Vault Markets: invest, lend, short and lever on vault items; the CBX market staking pool. Money is cents. */
  vaultMarkets: VaultMarketsResource;
  /** Escape hatch for endpoints not yet wrapped — call the raw HTTP client. */
  raw: HttpClient;
}

export function createClient(config: ClientConfig): CrosslyClient {
  const http = new HttpClient(config);
  return {
    inventory: new InventoryResource(http),
    listings: new ListingsResource(http),
    orders: new OrdersResource(http),
    sales: new SalesResource(http),
    inbox: new InboxResource(http),
    analytics: new AnalyticsResource(http),
    accounts: new AccountsResource(http),
    membership: new MembershipResource(http),
    connectedApps: new ConnectedAppsResource(http),
    automation: new AutomationResource(http),
    workflows: new WorkflowsResource(http),
    notifications: new NotificationsResource(http),
    network: new NetworkResource(http),
    catalog: new CatalogLookupResource(http),
    market: new MarketResource(http),
    embeds: new EmbedsResource(http),
    buyer: new BuyerResource(http),
    scan: new ScanResource(http),
    taxonomy: new TaxonomyResource(http),
    webhooks: new WebhooksResource(http),
    templates: new TemplatesResource(http),
    imports: new ImportsResource(http),
    returns: new ReturnsResource(http),
    customers: new CustomersResource(http),
    reference: new ReferenceResource(http),
    ai: new AIResource(http),
    tax: new TaxResource(http),
    profile: new ProfileResource(http),
    connections: new ConnectionsResource(http),
    pat: new PatResource(http),
    magic: new MagicResource(http),
    compWatchlists: new CompWatchlistsResource(http),
    restockPrompts: new RestockPromptsResource(http),
    savedViews: new SavedViewsResource(http),
    mobile: new MobileResource(http),
    team: new TeamResource(http),
    account: new AccountResource(http),
    sourcing: new SourcingResource(http),
    actionLog: new ActionLogResource(http),
    offers: new OffersResource(http),
    tradeBlock: new TradeBlockResource(http),
    breaks: new BreaksResource(http),
    groupBuys: new GroupBuysResource(http),
    policyReturns: new PolicyReturnsResource(http),
    production: new ProductionResource(http),
    grading: new GradingResource(http),
    stalls: new StallsResource(http),
    neighbourhoods: new NeighbourhoodsResource(http),
    homes: new HomesResource(http),
    reputation: new ReputationResource(http),
    worldLive: new WorldLiveResource(http),
    worldPlaces: new WorldPlacesResource(http),
    worldConventions: new WorldConventionsResource(http),
    spatialRooms: new SpatialRoomsResource(http),
    worldCreator: new WorldCreatorResource(http),
    worldCapabilities: new WorldCapabilitiesResource(http),
    worldContests: new WorldContestsResource(http),
    worldGames: new WorldGamesResource(http),
    worldAccount: new WorldAccountResource(http),
    worldStreets: new WorldStreetsResource(http),
    worldSpaces: new WorldSpacesResource(http),
    worldParties: new WorldPartiesResource(http),
    worldHomes: new WorldHomesResource(http),
    worldHunt: new WorldHuntResource(http),
    worldWishes: new WorldWishesResource(http),
    worldFireflies: new WorldFirefliesResource(http),
    worldLanterns: new WorldLanternsResource(http),
    worldKites: new WorldKitesResource(http),
    worldHall: new WorldHallResource(http),
    worldAurora: new WorldAuroraResource(http), worldGrails: new WorldGrailsResource(http), worldProvenance: new WorldProvenanceResource(http),
    worldChests: new WorldChestsResource(http),
    worldTrials: new WorldTrialsResource(http),
    worldArcade: new WorldArcadeResource(http),
    drops: new DropsResource(http),
    spatialEmotes: new SpatialEmotesResource(http),
    spatialParty: new SpatialPartyResource(http),
    games: new GamesResource(http),
    world: new WorldResource(http),
    nftMarket: new NftMarketResource(http),
    web3: new Web3Resource(http),
    policyPresets: new PolicyPresetsResource(http),
    catalogMatches: new CatalogMatchesResource(http),
    storefrontShipping: new StorefrontShippingResource(http),
    brandDrops: new BrandDropsResource(http),
    devices: new DevicesResource(http),
    payout: new PayoutResource(http),
    variationGroups: new VariationGroupsResource(http),
    passports: new PassportsResource(http),
    liveShows: new LiveShowsResource(http),
    loyalty: new LoyaltyResource(http),
    hotspots: new HotspotsResource(http),
    pricing: new PricingResource(http),
    videoRequests: new VideoRequestsResource(http),
    rentals: new RentalsResource(http),
    units: new UnitsResource(http),
    evidence: new EvidenceResource(http),
    spatial: new SpatialResource(http),
    spatialAuction: new SpatialAuctionResource(http),
    spatialEmployee: new SpatialEmployeeResource(http),
    wholesale: new WholesaleResource(http),
    vaultMarkets: new VaultMarketsResource(http),
    raw: http,
  };
}

/**
 * A CBX merchant client.
 *
 * Separate from `createClient` because a `cbx_` key is a different
 * PRINCIPAL, not a different token for the same one. It authenticates a
 * marketplace using CBX as its cashback rail — an entity with no Crossly
 * seller account — and it reaches only `/v1/cbx/*`. Handing it the full
 * `CrosslyClient` surface would offer dozens of resources that every
 * return 401, which is a worse developer experience than not offering
 * them.
 *
 * ```ts
 * const cbx = createCbxClient({ pat: process.env.CBX_API_KEY! });
 * await cbx.cbx.accrue({ subjectId, cents: 125, sourceExternalId: order.id });
 * ```
 */
export interface CbxClient {
  cbx: CbxResource;
  /**
   * Offsite ads — `/v1/ads/*`.
   *
   * A separate resource because it is a separate product. The budget is
   * denominated in CBX and managed under `cbx.ads`, but networks,
   * creative, attribution and policy are not token concerns. The same
   * merchant key authenticates both, since it is the same merchant
   * either way and a second credential would be a second thing to leak,
   * rotate and revoke for no gain.
   */
  ads: AdsResource;
  /**
   * COSM — the metaverse cosmetics currency.
   *
   * A different token with the OPPOSITE properties to CBX: minted on
   * demand rather than fixed, backed by nothing rather than a reserve,
   * and BURNED on spend rather than recirculated. Reading it as "the
   * other token" produces wrong decisions.
   *
   * Amounts are strings of base units with SIX decimals. There is no
   * withdrawal method, deliberately — COSM does not leave the platform
   * until the tokenomics preconditions are met.
   */
  cosm: CosmResource;
  /**
   * The Crossly DAO. Staked CBX votes on what the events pool funds.
   *
   * Governance rights are not a profit expectation, which is why this is
   * the one staking utility that needs no careful framing. The boundary
   * that keeps it that way: a vote can never direct funds to the voters.
   */
  dao: DaoResource;
  /**
   * Ad credit and threshold disbursements — `/v1/cbx/ad-credit/*`.
   *
   * GRANTED balance, not earned: ad credit is in-platform spend only and
   * is never withdrawable. Distinct from `ads`, which owns the campaign
   * itself — this is only the funding rail.
   */
  adCredit: CbxAdsResource;
  /**
   * Wholesale trade credit — `/v1/cbx/credit/*`.
   *
   * Secured by receivables already held, NOT collateralized by tokens.
   * There is no liquidation engine, no keeper and no oracle trigger: a
   * limit may fall, but a drawn balance is never accelerated.
   */
  credit: CbxCreditResource;
  /**
   * Earn rates, tiers and boosts — `/v1/cbx/accruals/*`, `/earn-tiers`.
   *
   * An accrual is CENTS until it matures, and becomes a token quantity
   * only then, priced at that moment.
   */
  rewards: CbxRewardsResource;
  /**
   * Staking and redemptions — `/v1/cbx/stake-tiers`, `/redemptions/*`.
   *
   * Staking multiplies an earn RATE and grants governance weight. It
   * pays no return on the stake itself, which is the property that keeps
   * it a loyalty mechanism.
   */
  staking: CbxStakingResource;
  /**
   * Paying from a self-custodied wallet — `/v1/cbx/wallet-payments/*`.
   *
   * Per-transaction signing against a bounded delegation. Screening
   * fails closed, so a material payment refuses rather than proceeding
   * unscreened.
   */
  walletPayments: CbxWalletPaymentsResource;
  /** Escape hatch for endpoints not yet wrapped. */
  raw: HttpClient;
}

export function createCbxClient(config: ClientConfig): CbxClient {
  const http = new HttpClient(config);
  return {
    cbx: new CbxResource(http),
    ads: new AdsResource(http),
    cosm: new CosmResource(http),
    dao: new DaoResource(http),
    // These five were exported but absent from the client (only `raw` reached
    // them) — v1-parity.test.ts's "every resource class is exposed" guards it.
    adCredit: new CbxAdsResource(http),
    credit: new CbxCreditResource(http),
    rewards: new CbxRewardsResource(http),
    staking: new CbxStakingResource(http),
    walletPayments: new CbxWalletPaymentsResource(http),
    raw: http,
  };
}
