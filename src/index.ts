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

import { HttpClient, type ClientConfig } from './client.js';
import {
  InventoryResource,
  ListingsResource,
  OrdersResource,
  SalesResource,
  InboxResource,
  AnalyticsResource,
  AccountsResource,
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
  PolicyPresetsResource,
  DevicesResource,
  PayoutResource,
  VariationGroupsResource,
  UnitsResource,
  EvidenceResource,
  SpatialResource,
  WholesaleResource,
  CbxResource,
  AdsResource,
} from './resources.js';
export type { ActionLogListParams } from './resources.js';
export type {
  PolicyPreset,
  PolicyPresetKind,
  PolicyPresetCreate,
  PolicyPresetUpdate,
} from './resources.js';
export type { CaptureVerdict, SealVerdict, ArrivalState } from './resources.js';
export type { WholesaleLine } from './resources.js';
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
  PolicyPresetsResource,
  DevicesResource,
  PayoutResource,
  VariationGroupsResource,
  UnitsResource,
  EvidenceResource,
  SpatialResource,
  WholesaleResource,
} from './resources.js';

export interface CrosslyClient {
  inventory: InventoryResource;
  listings: ListingsResource;
  orders: OrdersResource;
  sales: SalesResource;
  inbox: InboxResource;
  analytics: AnalyticsResource;
  accounts: AccountsResource;
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
  policyPresets: PolicyPresetsResource;
  devices: DevicesResource;
  /** Net payout per platform — fees + shipping, and the inverse for floors. */
  payout: PayoutResource;
  /** Listings sold as one product with options. Members stay STANDALONE
   *  listings — they publish on their own where variations aren't supported,
   *  so don't treat membership as "not for sale by itself". */
  variationGroups: VariationGroupsResource;
  /** Per-unit identity — serials/IMEIs, and the return check they enable. */
  units: UnitsResource;
  /** Packing video, seal comparison, arrival photos — the dispute bundle. */
  evidence: EvidenceResource;
  spatial: SpatialResource;
  /** Volume + account pricing, with the steps that produced the number. */
  wholesale: WholesaleResource;
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
    connectedApps: new ConnectedAppsResource(http),
    automation: new AutomationResource(http),
    workflows: new WorkflowsResource(http),
    notifications: new NotificationsResource(http),
    network: new NetworkResource(http),
    catalog: new CatalogLookupResource(http),
    market: new MarketResource(http),
    embeds: new EmbedsResource(http),
    buyer: new BuyerResource(http),
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
    policyPresets: new PolicyPresetsResource(http),
    devices: new DevicesResource(http),
    payout: new PayoutResource(http),
    variationGroups: new VariationGroupsResource(http),
    units: new UnitsResource(http),
    evidence: new EvidenceResource(http),
    spatial: new SpatialResource(http),
    wholesale: new WholesaleResource(http),
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
  /** Escape hatch for endpoints not yet wrapped. */
  raw: HttpClient;
}

export function createCbxClient(config: ClientConfig): CbxClient {
  const http = new HttpClient(config);
  return { cbx: new CbxResource(http), ads: new AdsResource(http), raw: http };
}
