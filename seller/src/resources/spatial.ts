import type { HttpClient, JsonObject } from './_shared.js';

/**
 * Spatial scenes — an inventory arranged as a physical place.
 *
 * ── Read the geometry as REAL ────────────────────────────────────────
 * Every dimension in a scene is metres, and matches the actual object: a
 * trading card is 0.0635 x 0.0889, a PSA slab is 0.0826 x 0.1334 x 0.0064, an
 * LP jacket is 0.314 square. That is deliberate and it is what makes these
 * responses portable — you can build the same room in another engine and it
 * will hold what this one holds.
 *
 * ── `pinned` is the field that matters ───────────────────────────────
 * Placement is inherited from a layout solver and overridden by humans.
 *
 *   pinned: true   a person put it there. It will not move.
 *   pinned: false  the solver chose. It MAY be somewhere else next time —
 *                  adding stock reflows the unpinned remainder.
 *
 * So do not persist an unpinned placement as though it were a location. If you
 * need a stable address for a physical copy, read the unit's `location`
 * instead, which is written when something is placed in a warehouse scene.
 */

/** 'collection' — arranged for looking at. 'warehouse' — must match reality. */
export type SceneKind = 'shop' | 'collection' | 'warehouse';

/** Defaults closed; a collection routinely holds things that are not for sale. */
export type SceneVisibility = 'private' | 'unlisted' | 'public';

export class SpatialResource {
  constructor(private http: HttpClient) {}

  /**
   * The rooms this account has — one per market category with catalog-resolved
   * stock, plus a warehouse.
   *
   * Rooms are created on first read rather than requiring setup, so this is
   * safe to call as an entry point on a brand-new account.
   */
  scenes() {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/spatial/scenes',
    });
  }

  /**
   * Public rooms anyone can walk into — the directory behind world-hopping.
   *
   * A room appears here when its owner sets visibility to `public`, which is
   * the act of publishing it. `unlisted` rooms are deliberately absent: that
   * setting means "reachable with the link", not "list me". Rooms with no
   * items are omitted, because an empty room is not a destination.
   *
   * Carries what a doorway needs and what a decision needs: name, slug,
   * category, `itemCount`, up to four `previewImages`, `forSaleCount`, a
   * `priceFromCents`/`priceToCents` band and `updatedAt`. The band is a BAND —
   * the authority on what one object costs is
   * `/api/public/spatial/{slug}/offers`, never this. Fetch the room itself
   * from `/api/public/spatial/{slug}`.
   */
  publicScenes() {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/spatial/public',
    });
  }

  /**
   * One solved room: the container geometry, every placement, and the items.
   *
   * `solved.overflow` lists anything that did not fit. It is reported rather
   * than dropped, so a non-empty array means the room is incomplete and the
   * count on screen would otherwise be a lie.
   */
  scene(sceneId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}`,
    });
  }

  /** Start a room: a collection or a warehouse (private until made public). */
  createScene(input: { kind: 'collection' | 'warehouse'; name: string; categorySlug?: string | null }) {
    return this.http.request<{ data: JsonObject }>({ method: 'POST', path: '/v1/spatial/scenes', body: input });
  }

  /** Rename one of your rooms. */
  renameScene(sceneId: string, name: string) {
    return this.http.request<{ data: JsonObject }>({ method: 'POST', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/rename`, body: { name } });
  }

  /** Make one of your rooms private, unlisted or public. */
  setSceneVisibility(sceneId: string, visibility: 'private' | 'unlisted' | 'public') {
    return this.http.request<{ data: JsonObject }>({ method: 'POST', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/visibility`, body: { visibility } });
  }

  /** A room's layout settings: grouping, sorting, theme, overlay, arrival camera. */
  updateSceneSettings(sceneId: string, settings: JsonObject) {
    return this.http.request<{ data: JsonObject }>({ method: 'PATCH', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/settings`, body: settings });
  }

  /**
   * A shared room, by its public slug — what a visitor sees.
   *
   * Same geometry and the same solved arrangement as `scene()`, REDACTED: no
   * cost, no storage location, no listing status, because none of those are a
   * visitor's business. Do not write code against this expecting the owner
   * view's fields.
   *
   * Resolves rooms shared as `unlisted` as well as `public`. `unlisted` is
   * absent from `publicScenes()` on purpose — it means "reachable with the
   * link", and holding the link is the permission.
   *
   * `pinned` still means what it means: false is a solver's choice and may
   * differ next time. A non-empty `solved.overflow` means the room is
   * incomplete and `stats.itemCount` is larger than what actually drew.
   */
  publicScene(slug: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/spatial/public/${encodeURIComponent(slug)}`,
    });
  }

  /**
   * What is for sale in a shared room: price, stock, condition, grade.
   *
   * Correlate each offer to the object on the shelf by `itemId` — the same id
   * the scene payload carries per item. Never by title; matching a room item to
   * a listing by resemblance is how somebody gets sold the wrong card.
   *
   * ── This is a SECOND call because it has a second lifetime ───────────
   * A room's shape is stable for minutes and is meant to be cached. A price is
   * not — it changes when the seller edits a listing — so a quote taken from a
   * cached response is a quote that may already be wrong. Re-read this before
   * quoting or adding to a cart; do not persist it beside the room.
   *
   * `priceCents` is cents. `available` is remaining stock or null, and null
   * means unknown rather than zero. An item in the room with no offer here is
   * not for sale, and an empty array is the owner showing a collection rather
   * than selling it — distinct from a 404, which is no such shared room.
   */
  publicSceneOffers(slug: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/spatial/public/${encodeURIComponent(slug)}/offers`,
    });
  }

  /** What a plot costs: price and weekly maintenance in cents, paid in CBX at spot. */
  plotQuote(street: string, number: number) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/spatial/streets/${encodeURIComponent(street)}/plots/${Math.trunc(number)}/quote`,
    });
  }

  /** Your deeds (address, status, paidThrough, lease) and the leases you rent. */
  property() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/spatial/property' });
  }

  /** Buy a vacant plot from Crossly in EARNED CBX; your shop moves onto it. */
  buyPlot(street: string, number: number) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/spatial/streets/${encodeURIComponent(street)}/plots/${Math.trunc(number)}/buy`,
      body: {},
    });
  }

  /** Pay a plot's maintenance forward, 1-12 weeks. */
  payMaintenance(deedId: string, weeks: number) {
    return this.http.request<JsonObject>({
      method: 'POST', path: `/v1/spatial/property/deeds/${encodeURIComponent(deedId)}/maintenance`, body: { weeks },
    });
  }

  /** Offer a vacant plot you own for lease at a weekly rent (cents). */
  offerLease(deedId: string, rentWeeklyCents: number) {
    return this.http.request<JsonObject>({
      method: 'POST', path: `/v1/spatial/property/deeds/${encodeURIComponent(deedId)}/lease`, body: { rentWeeklyCents },
    });
  }

  /** Take a plot on lease: pays the first week and moves your shop onto it. */
  acceptLease(leaseId: string) {
    return this.http.request<JsonObject>({
      method: 'POST', path: `/v1/spatial/property/leases/${encodeURIComponent(leaseId)}/accept`, body: {},
    });
  }

  /** Pay rent forward, 1-12 weeks. Waived while the owner is delinquent. */
  payRent(leaseId: string, weeks: number) {
    return this.http.request<JsonObject>({
      method: 'POST', path: `/v1/spatial/property/leases/${encodeURIComponent(leaseId)}/rent`, body: { weeks },
    });
  }

  /** End a lease, as owner or tenant. */
  endLease(leaseId: string) {
    return this.http.request<JsonObject>({
      method: 'POST', path: `/v1/spatial/property/leases/${encodeURIComponent(leaseId)}/end`, body: {},
    });
  }

  /** Your shop's staff (people holding a `staff` grant) and their weekly wages. */
  shopStaff() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/spatial/shop/staff' });
  }

  /** Shops you work in as staff. */
  staffing() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/spatial/staffing' });
  }

  /** Set (or clear with null) a staff member's weekly wage in cents. */
  setStaffWage(grantId: string, wageWeeklyCents: number | null) {
    return this.http.request<JsonObject>({
      method: 'PUT', path: `/v1/spatial/shop/staff/${encodeURIComponent(grantId)}/wage`, body: { wageWeeklyCents },
    });
  }

  /** Pay a staff member's wage forward, 1-4 weeks, from your EARNED CBX. */
  payStaff(grantId: string, weeks: number) {
    return this.http.request<JsonObject>({
      method: 'POST', path: `/v1/spatial/shop/staff/${encodeURIComponent(grantId)}/pay`, body: { weeks },
    });
  }

  /** Plots for resale, cheapest first; `street` narrows to one street. */
  deedListings(street?: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/spatial/deeds/listings', query: street ? { street } : undefined });
  }

  /** List a plot you own for resale at an asking price in cents. */
  listDeed(deedId: string, priceCents: number) {
    return this.http.request<JsonObject>({
      method: 'POST', path: `/v1/spatial/property/deeds/${encodeURIComponent(deedId)}/list`, body: { priceCents },
    });
  }

  /** Take your plot off the resale market. */
  cancelDeedListing(listingId: string) {
    return this.http.request<JsonObject>({
      method: 'POST', path: `/v1/spatial/property/listings/${encodeURIComponent(listingId)}/cancel`, body: {},
    });
  }

  /** Buy a plot on the resale market in EARNED CBX; the deed, its maintenance clock and any lease pass to you. */
  buyDeed(listingId: string) {
    return this.http.request<JsonObject>({
      method: 'POST', path: `/v1/spatial/property/listings/${encodeURIComponent(listingId)}/buy`, body: {},
    });
  }

  /** What founding a street costs (premium + weekly upkeep, cents, paid in CBX), `cbx.open`, and your `refusal` or null. */
  streetFounding() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/spatial/streets/founding' });
  }

  /** Streets you hold or asked to found: status, upkeep, admission, occupancy, Crossly's review note. */
  myStreets() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/spatial/streets/mine' });
  }

  /** Ask to found a street (free; Crossly reviews the name). `admission`: open | apply | invite. */
  requestStreet(input: { name: string; slug?: string; admission?: 'open' | 'apply' | 'invite' }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/spatial/streets/requests', body: input });
  }

  /** Found an approved street: pays the premium in EARNED CBX. 403 until CBX is minted. */
  foundStreet(id: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/spatial/streets/requests/${encodeURIComponent(id)}/found`, body: {} });
  }

  /** Pay a founded street's upkeep forward, 1-12 weeks, in CBX. */
  payStreetUpkeep(id: string, weeks: number) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/spatial/streets/owned/${encodeURIComponent(id)}/upkeep`, body: { weeks } });
  }

  /** Every street: slug, name, plotCount, occupied; `platform` is Main Street. */
  streets() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/spatial/streets' });
  }

  /**
   * A street plot by plot from the entrance. Each plot carries its `address`
   * (`<street>/<number>`, stable while its shop stands there), a `label`
   * ("12 Main Street"), and `shop` (the open shop's directory entry) or null.
   * Open shops carry `life` (`soldToday`, `window`); the street carries
   * `life.billboards` and `life.buskers`.
   */
  street(slug: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/spatial/streets/${encodeURIComponent(slug)}` });
  }

  /** The shop at `<street>/<number>`: its `publicSlug` and `name`. 404 when vacant or not public. */
  address(street: string, number: number) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/spatial/address/${encodeURIComponent(street)}/${Math.trunc(number)}`,
    });
  }

  /** Your shop's addresses — one per street it stands on. */
  shopAddresses() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/spatial/shop/addresses' });
  }

  /** Put your (public) shop on an open street; returns its plot `index` and `address`. */
  claimStreetPlot(slug: string) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/spatial/streets/${encodeURIComponent(slug)}/claim`,
      body: {},
    });
  }

  /** Take your shop off a street. Its address may then go to another shop. */
  leaveStreet(slug: string) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/spatial/streets/${encodeURIComponent(slug)}/plot`,
    });
  }

  /**
   * A warehouse room as it stands: every rack with its location code, floor
   * position (metres), capacity, stocked count and fill, and the items on it.
   * Correlate racks by `id`; a `code` changes when a zone is relabelled.
   */
  warehouse(sceneId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/warehouse`,
    });
  }

  /**
   * Stock movements in a room — where things WENT, not where they sit.
   *
   * One row per physical transition: the item, the node it came from, the node
   * it went to, when, and what kind of move it was
   * (`placed`/`moved`/`picked`/`shipped`/`received`/`removed`). This is the
   * only surface that answers "was this shelf busy", and it exists because
   * nothing else records a transition — a placement write overwrites the
   * previous location as it stores the new one.
   *
   * ── Correlate on the node IDS ────────────────────────────────────
   * `fromCode` / `toCode` are display snapshots of the location code AT THE
   * TIME of the move ('A-3-2'). They are neither stable nor unique: a code is
   * derived from the rack's position in the room, so renaming a zone rewrites
   * every code beneath it, and two rooms readily produce the same string.
   * Joining movements to shelves on the code silently merges the histories of
   * unrelated racks. `fromNodeId` / `toNodeId` identify a place; the codes are
   * for printing.
   *
   * A null `toNodeId` on a `shipped` or `picked` row means it left the
   * building. That is a fact, not missing data.
   *
   * ── No employee attribution here ─────────────────────────────────
   * Movements ARE attributed internally, and the dashboard shows the account
   * owner and team admins who moved what. A token has no team role, so there
   * is no honest way to tell whether its holder is the employer or one of the
   * staff being recorded — and guessing permissively would make a PAT a route
   * around a boundary the UI enforces. `meta.attributed` is always false and
   * no actor field is returned.
   *
   * @param window ISO timestamps. Defaults to the last seven days; the server
   *   clamps the span to 90 days. `meta.truncated` is true when the window held
   *   more rows than one response carries, in which case the OLDEST were cut —
   *   narrow the window rather than paging backwards through it.
   */
  movements(sceneId: string, window: { since?: string; until?: string } = {}) {
    const q = new URLSearchParams();
    if (window.since) q.set('since', window.since);
    if (window.until) q.set('until', window.until);
    const qs = q.toString();

    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/movements${qs ? `?${qs}` : ''}`,
    });
  }
}
