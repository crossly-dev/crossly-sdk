import type { HttpClient, JsonObject } from './_shared.js';

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
}
