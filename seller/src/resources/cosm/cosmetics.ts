/**
 * The catalogue and what a subject owns: buying, holding, vanity handles,
 * the cash storefront, and the stake-exclusive grant.
 *
 * One link in the `CosmResource` chain — see `./base.js`. Every method here
 * is reached as `client.cosm.<name>()`.
 */
import type { JsonObject } from '../_shared.js';
import type { CosmeticTier } from './types.js';
import { CosmCurrencyMethods } from './currency.js';

export class CosmCosmeticsMethods extends CosmCurrencyMethods {
  /**
   * The cosmetics catalogue.
   *
   * Tiers are DISJOINT and no SKU carries two prices: `premium` is cash
   * only, `earned` is COSM only, `stake_exclusive` cannot be bought at
   * any price in any currency.
   *
   * That is not presentation. Pricing one SKU in both currencies would
   * expose a fixed COSM price to a floating market price, which is free
   * money in the gap and hands limited editions to whoever automates it
   * first.
   */
  cosmetics(filters?: { tier?: CosmeticTier; slot?: string }) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/cosmetics',
      query: filters as Record<string, string> | undefined,
    });
  }

  /**
   * Buy an earned-tier cosmetic. The COSM is DESTROYED.
   *
   * Not credited to a treasury: keeping it would make cosmetics a round
   * trip rather than a sink, and the epoch backstop is computed FROM the
   * burn, so recycling would uncouple emission from consumption.
   *
   * Refuses a premium or stake-exclusive SKU — those are not sold for
   * COSM at all.
   */
  buyCosmetic(cosmeticId: string, subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cosm/cosmetics/${encodeURIComponent(cosmeticId)}/buy`,
      body: { subjectId },
    });
  }

  /**
   * Cosmetics a subject holds.
   *
   * `bound` is derived from how the item was acquired and enforced by a
   * database CHECK rather than set by hand: a stake-exclusive grant and
   * a make-good are bound forever, everything else trades. A bound item
   * cannot be listed or used as a fusion input.
   *
   * `editionNumber` identifies the ITEM and travels with it through a
   * sale — a reissued #7 would falsify every scarcity claim a market has
   * priced.
   */
  inventory(subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/inventory',
      query: { subjectId },
    });
  }

  /**
   * Which spatial cosmetic values this subject may apply.
   *
   * Paint a picker from this. Values no SKU claims — the stock walls,
   * floors and themes — are free and are not listed here.
   */
  unlocks(subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/unlocks',
      query: { subjectId },
    });
  }

  /**
   * Is a vanity handle available, and what does it cost?
   *
   * Handles are lowercased and constrained to a narrow character class,
   * because anything that can be made to LOOK like another handle is an
   * impersonation vector rather than an expressive option.
   *
   * Priced by length — short names are scarcer. Uniqueness is
   * platform-wide, not per merchant: it is a URL namespace.
   */
  handle(handle: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/cosm/handles/${encodeURIComponent(handle)}`,
    });
  }

  /**
   * Claim a vanity handle, burning COSM.
   *
   * One live handle per subject: collecting handles is a land grab that
   * makes the good names unavailable, not a sink.
   *
   * There is no refund on release. The COSM was burned, and refunding
   * would mean minting.
   */
  claimHandle(input: { subjectId: string; handle: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cosm/handles',
      body: input,
    });
  }

  /**
   * Release a handle. **Nothing is refunded.**
   *
   * The COSM paid for it was burned, so there is nothing to give back —
   * refunding would mean minting. Say so in the UI before calling this;
   * a user expecting a refund reads silence as a bug.
   *
   * The handle returns to the pool and anyone may claim it, so this is
   * not a way to park one.
   */
  releaseHandle(params: { subjectId: string; reason: string }) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: '/v1/cosm/handles',
      body: params,
    });
  }

  // ── Storefront: cash, and what cash cannot buy ────────────────────

  /**
   * Buy a dollar-priced cosmetic, paying in CBX. Digital cosmetics are
   * PRICED in dollars and never SOLD for dollars: `priceCents` is paid from
   * the subject's EARNED CBX at spot. `requestKey` (8-64 chars, one per
   * purchase attempt) makes a retry the same purchase; if the grant fails
   * after payment (sold out, already held) the spend is reversed.
   */
  buyCosmeticWithCbx(
    cosmeticId: string,
    params: { subjectId: string; requestKey: string },
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cosm/cosmetics/${encodeURIComponent(cosmeticId)}/buy-cbx`,
      body: params,
    });
  }

  /**
   * Claim a stake-exclusive cosmetic once tenure qualifies.
   *
   * Bound forever, and purchasable by nobody at any price in any
   * currency. What people buy in cosmetics is status, and anything
   * purchasable is by definition available to anyone with money.
   *
   * A short tenure comes back as `granted: false` with `tenureDays` and
   * `requiredDays` — that is the normal answer, not an error, so render
   * progress rather than a failure. Idempotent while the copy is held.
   */
  claimStakeExclusive(cosmeticId: string, params: { subjectId: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cosm/cosmetics/${encodeURIComponent(cosmeticId)}/claim`,
      body: params,
    });
  }

  /**
   * How long a subject has held a stake CONTINUOUSLY, in days.
   *
   * The figure every stake-exclusive grant is decided on. A gap resets
   * it and a cooling stake does not count, so this is not "time since
   * they first staked" and must not be presented as such.
   */
  stakeTenure(params: { subjectId: string }) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/stake-tenure',
      query: params,
    });
  }

  /**
   * Set — or clear — what a cosmetic unlocks spatially.
   *
   * Both or neither. A key with no value would claim EVERY value of
   * that key and silently gate the whole control, so a half-pair is
   * collapsed to two nulls and the response echoes what was APPLIED.
   * Two nulls remove the gate, making the control free for everyone.
   *
   * Treasury scope: this changes what every holder can reach.
   */
  setCosmeticUnlock(
    cosmeticId: string,
    params: { unlocksKey: string | null; unlocksValue: string | null },
  ) {
    return this.http.request<JsonObject>({
      method: 'PUT',
      path: `/v1/cosm/cosmetics/${encodeURIComponent(cosmeticId)}/unlock`,
      body: params,
    });
  }
}
