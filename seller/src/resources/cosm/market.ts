/**
 * Markets: the COSM-denominated auction house, fusion, and the CBX listing
 * pegs that happen to be routed under `/v1/cosm/*`.
 *
 * One link in the `CosmResource` chain — see `./base.js`. Every method here
 * is reached as `client.cosm.<name>()`.
 */
import type { JsonObject } from '../_shared.js';
import { CosmCosmeticsMethods } from './cosmetics.js';

export class CosmMarketMethods extends CosmCosmeticsMethods {
  /**
   * Open auction listings, priced in COSM.
   *
   * A COSM-denominated peer market: buyers pay COSM, sellers receive
   * COSM, and the 8% fee burns. Not a cash market — a cash resale market
   * for COSM-bought items would reintroduce the arbitrage between a
   * fixed COSM price and a floating market one.
   */
  auction(cosmeticId?: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/auction',
      query: cosmeticId ? { cosmeticId } : undefined,
    });
  }

  /**
   * What a listing would cost in fees, before committing.
   *
   * The fee is 8% of the ask rounded UP, so a small listing can never
   * pay nothing — a zero-fee listing would be a free transfer channel,
   * which the design forbids outright. The seller always nets something.
   */
  auctionQuote(askBaseUnits: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/auction/quote',
      query: { askBaseUnits },
    });
  }

  /**
   * List an owned cosmetic for COSM.
   *
   * Refuses a bound item. One open listing per item, enforced by a
   * unique index — otherwise the same cosmetic could be listed twice and
   * sold to two buyers.
   *
   * `askBaseUnits` is a string of base units and must exceed 1.
   */
  list(input: {
    subjectId: string;
    ownershipId: string;
    askBaseUnits: string;
    expiresAt?: string;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cosm/auction',
      body: input,
    });
  }

  /**
   * Buy an open listing.
   *
   * The listing is claimed out of `open` BEFORE any COSM moves, so the
   * loser of a race is refused rather than debited. Buying your own
   * listing is refused by a database CHECK: it would burn the fee for
   * nothing and is the obvious way to fake a market price.
   */
  buyListing(listingId: string, subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cosm/auction/${encodeURIComponent(listingId)}/buy`,
      body: { subjectId },
    });
  }

  /**
   * Fuse two cosmetics plus COSM into a rarer one.
   *
   * The deepest sink available: it destroys on three axes at once — both
   * input items AND the COSM cost — while producing something whose
   * scarcity is real, because a recipe is the only route to it.
   *
   * Inputs must be owned, live, unbound and flagged fusable.
   * Stake-exclusive items can never be consumed: there is no way to
   * reissue one without falsifying its scarcity.
   */
  fuse(recipeId: string, subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cosm/fusion/${encodeURIComponent(recipeId)}`,
      body: { subjectId },
    });
  }

  // ── CBX listing pegs ─────────────────────────────────────────────
  //
  // Under `/v1/cosm/*` for routing reasons; the peg itself is a CBX
  // price control and has nothing to do with COSM.

  /**
   * CBX-pegged listings and why each price last moved.
   *
   * `lastReason` — repriced, no_rate, below_threshold, clamped_floor,
   * clamped_ceiling, clamped_change — is the field that answers "why has
   * my price not moved". Read it before assuming the repricer is broken.
   */
  pegs(params: { sellerUserId: string }) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/pegs',
      query: { sellerUserId: params.sellerUserId },
    });
  }

  /**
   * Hold a listing's CBX ask at a dollar target, repriced hourly.
   *
   * Priced off a 24h MINIMUM rate, never spot — tracking spot would let
   * somebody pump CBX, watch every pegged ask drop, and pay with cheaply
   * bought tokens.
   *
   * The three bounds are not interchangeable. `maxChangeBps` limits the
   * damage of one bad reading (the peg converges over cycles instead);
   * `floorBaseUnits`/`ceilingBaseUnits` are the seller's own stops, so a
   * sustained real move never posts a price they did not consider; and
   * `minChangeBps` stops the ask being rewritten for a fraction of a
   * percent.
   *
   * What it cannot do: accepting CBX means holding CBX. This protects
   * the dollar value of the ASK, not of the tokens once received.
   */
  setPeg(params: {
    platformListingId: string;
    sellerUserId: string;
    enabled: boolean;
    targetCents: number;
    floorBaseUnits?: string;
    ceilingBaseUnits?: string;
    maxChangeBps?: number;
    minChangeBps?: number;
  }) {
    return this.http.request<JsonObject>({
      method: 'PUT',
      path: '/v1/cosm/pegs',
      body: params,
    });
  }

  /**
   * Stop repricing a listing.
   *
   * The ask stays where it is. Removing a peg does not restore an
   * earlier price.
   */
  removePeg(listingId: string, params: { sellerUserId: string }) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/cosm/pegs/${encodeURIComponent(listingId)}`,
      body: params,
    });
  }
}
