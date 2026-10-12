import type { HttpClient } from './_shared.js';

// ─── Streets, decor, leases and neighbourhoods in Crossly World ──────────
//
// Street admissions and invitations, street and stall decor, lease offers,
// moving your shop, what visitors looked at, the room catalogue, and "I would
// buy this". Listing on the decor market charges a COSM fee and stays on
// crossly.net; this resource only reads it.

/** A world read or write result, as the api returns it. */
export type WorldStreetRecord = Record<string, unknown>;

export class WorldStreetsResource {
  constructor(private readonly http: HttpClient) {}

  /** Withdraw a street request not founded yet. */
  withdrawStreetRequest(id: string) {
    return this.http.request<{ data: WorldStreetRecord }>({ method: 'DELETE', path: `/v1/spatial/streets/requests/${encodeURIComponent(id)}` });
  }

  /** Who may open a shop on a street you own. */
  setStreetAdmission(id: string, admission: string) {
    return this.http.request<{ data: WorldStreetRecord }>({ method: 'PATCH', path: `/v1/spatial/streets/owned/${encodeURIComponent(id)}`, body: { admission } });
  }

  /** Street applications and invitations. */
  streetAdmissions() {
    return this.http.request<{ data: WorldStreetRecord }>({ method: 'GET', path: `/v1/spatial/streets/admissions` });
  }

  /** Ask to open your shop on a street. */
  applyToStreet(slug: string) {
    return this.http.request<{ data: WorldStreetRecord }>({ method: 'POST', path: `/v1/spatial/streets/${encodeURIComponent(slug)}/apply`, body: {} });
  }

  /** Invite a shop to a street you own. */
  inviteToStreet(slug: string, shopSlug: string) {
    return this.http.request<{ data: WorldStreetRecord }>({ method: 'POST', path: `/v1/spatial/streets/${encodeURIComponent(slug)}/invite`, body: { shopSlug } });
  }

  /** Plots on a street offered for lease. */
  streetLeases(slug: string) {
    return this.http.request<{ data: WorldStreetRecord[] }>({ method: 'GET', path: `/v1/spatial/streets/${encodeURIComponent(slug)}/leases` });
  }

  /** The decor on a street you may dress. */
  streetDecor(slug: string) {
    return this.http.request<{ data: WorldStreetRecord }>({ method: 'GET', path: `/v1/spatial/streets/${encodeURIComponent(slug)}/decor` });
  }

  /** Dress a street you own. */
  setStreetDecor(slug: string, decor: Record<string, unknown>) {
    return this.http.request<{ data: WorldStreetRecord }>({ method: 'PUT', path: `/v1/spatial/streets/${encodeURIComponent(slug)}/decor`, body: decor });
  }

  /** Withdraw a lease offer nobody accepted. */
  withdrawLeaseOffer(id: string) {
    return this.http.request<{ data: WorldStreetRecord }>({ method: 'POST', path: `/v1/spatial/property/leases/${encodeURIComponent(id)}/withdraw`, body: {} });
  }

  /** Streets you may dress. */
  decoratableStreets() {
    return this.http.request<{ data: WorldStreetRecord[] }>({ method: 'GET', path: `/v1/world/decor/streets` });
  }

  /** Your stall bookings, to dress their booths. */
  stallsToDress() {
    return this.http.request<{ data: WorldStreetRecord[] }>({ method: 'GET', path: `/v1/world/decor/stalls` });
  }

  /** Dress the booth of a stall you booked. */
  dressStallBooth(id: string, booth: Record<string, unknown>) {
    return this.http.request<{ data: WorldStreetRecord }>({ method: 'PUT', path: `/v1/world/stalls/bookings/${encodeURIComponent(id)}/booth`, body: booth });
  }

  /** Take placed decor back into your inventory. */
  retractDecor(input: { space: { kind: string; id: string }; key: string; value: string }) {
    return this.http.request<{ data: WorldStreetRecord }>({ method: 'POST', path: `/v1/world/decor/retract`, body: input });
  }

  /** Decor copies others are reselling (read only). */
  decorMarket() {
    return this.http.request<{ data: WorldStreetRecord[] }>({ method: 'GET', path: `/v1/world/decor/market` });
  }

  /** Your shop's neighbourhood. */
  shopNeighbourhood() {
    return this.http.request<{ data: WorldStreetRecord }>({ method: 'GET', path: `/v1/spatial/shop/neighbourhood` });
  }

  /** Move your shop to another neighbourhood. */
  moveShop(slug: string) {
    return this.http.request<{ data: WorldStreetRecord }>({ method: 'POST', path: `/v1/spatial/shop/neighbourhood`, body: { slug } });
  }

  /** What visitors looked at in one of your rooms. */
  roomAttention(sceneId: string) {
    return this.http.request<{ data: WorldStreetRecord }>({ method: 'GET', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/attention` });
  }

  /** The room catalogue and warehouse units. */
  spaces() {
    return this.http.request<{ data: WorldStreetRecord }>({ method: 'GET', path: `/v1/spatial/spaces` });
  }

  /** Tell a room owner you would buy an item. */
  wantItem(slug: string, itemId: string) {
    return this.http.request<{ data: WorldStreetRecord }>({ method: 'POST', path: `/v1/world/places/${encodeURIComponent(slug)}/items/${encodeURIComponent(itemId)}/want`, body: {} });
  }
}
