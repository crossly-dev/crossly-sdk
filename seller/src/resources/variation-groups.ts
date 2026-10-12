import type { HttpClient, IdempotencyOpts, JsonObject } from './_shared.js';

/**
 * One option within a variation group — a real, standalone listing that also
 * belongs to a product.
 *
 * It keeps publishing on its own where variations aren't supported, so do not
 * treat membership as "this listing is not for sale by itself".
 */
export interface VariationMember {
  listingId: string;
  /** Its value on the group's axis: "M", "10.5", "Near Mint". */
  axisValue: string | null;
  sortKey: number;
  title: string | null;
  price: string | null;
  images: string[] | null;
  status: string;
  sku: string | null;
  quantityAvailable: number;
}

export interface VariationGroupRollup {
  memberCount: number;
  /** Cheapest option — the "from" price. Not an average or a sum. */
  fromPriceCents: number | null;
  status: string;
  availableUnits: number;
  /**
   * Options in a failed / sync_failed state.
   *
   * Worth checking: options are hidden from the listings grid, so for a
   * dashboard this is the only place a broken one surfaces.
   */
  needsAttention: number;
}

export interface VariationGroup {
  id: string;
  title: string | null;
  kind: 'variation' | 'group' | null;
  config: { axisName?: string } & JsonObject;
  members: VariationMember[];
  rollup: VariationGroupRollup;
}

/** What publishing to one platform would actually produce. */
export interface PlatformPublishPlan {
  platform: string;
  /** `grouped` = one listing with a dropdown. `separate` = one listing PER
   *  option, because the platform has no variation concept (Depop, Poshmark,
   *  Mercari, …) or Crossly hasn't wired its variation call yet. */
  mode: 'grouped' | 'separate';
  listingsProduced: number;
  explanation: string;
}

export interface PublishPlan {
  plans: PlatformPublishPlan[];
  /** Total marketplace listings this would create across all platforms. */
  totalListings: number;
  memberCount: number;
  axisName: string;
}

/**
 * Variation groups — several of your listings sold as one product.
 *
 * The distinction that matters when scripting against this: a group's members
 * are STANDALONE listings, not children. They appear in `/v1/listings`, they
 * publish independently to platforms without variation support, and each has
 * its own inventory, COGS and lifecycle. The group is an additional fact
 * about them, not a container that owns them.
 *
 * Which is why `groupForListing` exists — repricing four sizes independently,
 * or counting them as four products, is wrong in a way that only shows up in
 * the numbers.
 */
export class VariationGroupsResource {
  constructor(private readonly http: HttpClient) {}

  /** Every variation group you own, with its options and rollup. */
  async list(): Promise<{ items: VariationGroup[] }> {
    return this.http.request<{ items: VariationGroup[] }>({ method: 'GET', path: '/api/v1/variation-groups' });
  }

  async get(groupId: string): Promise<VariationGroup> {
    return this.http.request<VariationGroup>({ method: 'GET', path: `/api/v1/variation-groups/${groupId}` });
  }

  /** The group a listing belongs to, or `{ group: null }`. */
  async forListing(listingId: string): Promise<{
    group: { groupListingId: string; axisValue: string | null } | null;
  }> {
    return this.http.request<{ group: { groupListingId: string; axisValue: string | null } | null }>({
      method: 'GET',
      path: `/api/v1/listings/${listingId}/variation-group`,
    });
  }

  /**
   * What publishing to these platforms would do — WITHOUT publishing.
   *
   * Answers "if I list this on Depop, how many listings do I get" before you
   * commit, which is the question worth asking: on a platform with no
   * variation support a four-option group becomes four separate listings,
   * and finding that out afterwards means four sets of watchers to unpick.
   */
  async publishPlan(groupId: string, platforms: string[]): Promise<PublishPlan> {
    return this.http.request<PublishPlan>({
      method: 'GET',
      path: `/api/v1/variation-groups/${groupId}/publish-plan`,
      query: { platforms: platforms.join(',') },
    });
  }

  /** Group listings you already have. `kind: 'group'` with a `rule` makes a purchase-rule group ("buy any 3"). */
  async create(input: { kind?: 'variation' | 'group'; title?: string; axisName?: string; rule?: PurchaseRule; members: Array<{ listingId: string; axisValue?: string }> }, opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: { id: string; members: VariationMember[]; rollup: VariationGroupRollup } }>({ method: 'POST', path: '/api/v1/variation-groups', body: input, idempotencyKey: opts.idempotencyKey });
  }

  /** One listing becomes a group: each new value is its own listing (a copy) with its own price, quantity and SKU. */
  async generate(input: GenerateVariationsInput, opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: { id: string; optionListingIds: string[]; members: VariationMember[] } }>({ method: 'POST', path: '/api/v1/variation-groups/generate', body: input, idempotencyKey: opts.idempotencyKey });
  }

  /** Retitle, rename the axis, or change a group's purchase rule. */
  async update(groupId: string, input: { title?: string; axisName?: string; rule?: PurchaseRule }) {
    return this.http.request<{ data: { id: string; members: VariationMember[] } }>({ method: 'PATCH', path: `/api/v1/variation-groups/${groupId}`, body: input });
  }

  /** Publish per platform; each platform reports its own outcome. Check `publishPlan` first. */
  async publish(groupId: string, platforms: string[], opts: IdempotencyOpts & { accountSlot?: number } = {}) {
    return this.http.request<{ data: { outcomes: GroupPublishOutcome[]; published: number } }>({ method: 'POST', path: `/api/v1/variation-groups/${groupId}/publish`, body: { platforms, ...(opts.accountSlot ? { accountSlot: opts.accountSlot } : {}) }, idempotencyKey: opts.idempotencyKey });
  }

  /** Dissolve the group; its options stay as ordinary listings. */
  async dissolve(groupId: string) {
    return this.http.request<{ data: { ok: boolean } }>({ method: 'DELETE', path: `/api/v1/variation-groups/${groupId}` });
  }
}

export interface GroupPublishOutcome { platform: string; mode: string; ok: boolean; listingId?: string; error?: string }

/** #1609: "buy any N from this group" / "spend at least X". Written into every member's description; enforced at Crossly checkout. */
export interface PurchaseRule {
  minQty?: number;
  minSpendCents?: number;
  note?: string;
  allowPairWithAnyItem?: boolean;
}

export interface GenerateVariationsInput {
  sourceListingId: string;
  /** "Size", "Colour", "Condition". Size, colour and condition also set the option listing's own field. */
  axisName: string;
  /** This listing's own value on the axis, e.g. "M". */
  sourceValue: string;
  /** Blank price/quantity/sku inherit from the source (quantity defaults to 1). */
  options: Array<{ value: string; price?: number; quantity?: number; sku?: string }>;
}

