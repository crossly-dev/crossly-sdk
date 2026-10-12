import type { HttpClient, JsonObject, IdempotencyOpts } from './_shared.js';

/**
 * The auction house inside a spatial room.
 *
 * A live saleroom bound into one of the 3D rooms `spatial` describes: a human
 * auctioneer takes bids on one lot at a time and drops the hammer by hand.
 * Everything here reads and writes the SAME live-auction tables the standalone
 * auction page uses, so there is one price and one catalogue, never a room's
 * copy of them.
 *
 * ── DIGITAL GOODS ONLY, AND THAT IS NOT A SETTING ────────────────────
 * A physical item is never sold in here. There is no shipping, escrow or
 * dispute path behind a bid, so `bid()` answers 403 with
 * `details.reason === 'physical_lot'` for a lot whose listing is not digital —
 * checked against the listing on EVERY bid rather than once when the room was
 * set up, because a lot can be added, or a listing reclassified, afterwards.
 * Physical goods are sold for cash or CBX through the ordinary listing flow.
 *
 * ── THREE RULES FOR READING ANY OF THIS ──────────────────────────────
 *  1. EVERY AMOUNT IS CENTS.
 *  2. Use `minimumNextBidCents`. Never compute `currentBidCents +
 *     bidIncrementCents` — the OPENING bid on a lot is floored at the start
 *     price rather than start + step, so deriving it locally quietly raises
 *     the entry price on any lot carrying a real increment, and your bid is
 *     then refused by a rule you thought you had implemented.
 *  3. The reserve AMOUNT is never published. `reserveMet` is all you get, and
 *     all a bidder in a real saleroom gets: a crowd that can read the floor
 *     bids to it and stops.
 *
 * ── THE AUCTIONEER IS THE AUTHORITY ON WHICH LOT IS UP ───────────────
 * Not the lot list, and not the lowest open lot number — a human can skip
 * ahead. Take the current lot from `room()`, and if you hold a lot id from an
 * earlier `lots()` call, pass it to `bid()` so a mismatch is refused with 409
 * instead of buying you something you never looked at.
 */
export class SpatialAuctionResource {
  constructor(private http: HttpClient) {}

  /**
   * Rooms YOU own that are currently hosting an auction, with the session's
   * title, status and schedule joined in.
   *
   * An empty list is the ordinary answer — hosting nothing is the normal state
   * of every room on the platform. This is not a directory of salerooms you
   * could bid in; for somebody else's room, take a slug from
   * `spatial.publicScenes()` and open it with `publicRoom()`.
   *
   * `topics.auction` is the WebSocket topic every price movement is broadcast
   * on. `topics.room` is null until the room has been shared publicly.
   */
  rooms() {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/spatial/auction/rooms',
    });
  }

  /**
   * What the rostrum says in one room, right now: the session, the current
   * lot, the standing price and the minimum the next bid must clear.
   *
   * Served to anyone who may ENTER the room, not only its owner — the point of
   * a saleroom is a crowd. `hosting: false` with a null `auction` is a
   * described empty answer rather than an error, and a room you may not enter
   * answers 404 exactly as one that does not exist does.
   *
   * `serverTime` is the SERVER's clock, handed over deliberately. There is no
   * per-lot deadline to report — a lot closes when a human drops the hammer,
   * not when a timer expires — so a countdown would be a fabrication. Age the
   * session against this rather than against the local wall clock.
   */
  room(sceneId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/spatial/auction/rooms/${encodeURIComponent(sceneId)}`,
    });
  }

  /**
   * The catalogue: every lot in the session this room is hosting, in the order
   * the auctioneer will reach them.
   *
   * A lot carrying a `hammerAt` has been sold; one with `skipped: true` failed
   * its reserve. Neither takes further bids. A room hosting nothing answers an
   * empty list rather than a 404 — a 404 here means the room does not exist or
   * you may not enter it.
   *
   * Do NOT infer the current lot from this list. The auctioneer may skip
   * ahead, and `room()` is the only thing that knows.
   */
  lots(sceneId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/spatial/auction/rooms/${encodeURIComponent(sceneId)}/lots`,
    });
  }

  /**
   * A shared saleroom, opened by the public share handle.
   *
   * The bridge between the room directory and everything else here:
   * `spatial.publicScenes()` hands out SLUGS while these methods are keyed by
   * scene id, and the two are deliberately not interchangeable. The reply
   * carries the `sceneId` to pass to `room()`, `lots()` and `bid()`.
   *
   * Resolves `public` rooms only. An `unlisted` room is a bearer link and
   * crowd-shaped features stay off in those, so a slug that opens fine through
   * `spatial.publicScene()` may still answer 404 here.
   */
  publicRoom(slug: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/spatial/auction/public/${encodeURIComponent(slug)}`,
    });
  }

  /**
   * Bid on the lot currently up in a room.
   *
   * @param params.amountCents CENTS, and at least the room's
   *   `minimumNextBidCents`. Below it you get 400 `bid_too_low` carrying
   *   `details.minimumNextBidCents` — the figure the transaction itself used,
   *   so raise to exactly that and retry rather than guessing a step.
   * @param params.lotId Optional, and worth sending whenever your idea of the
   *   current lot came from anywhere but a fresh `room()`. It is CHECKED
   *   against the rostrum rather than used in its place: a mismatch is 409
   *   with the lot that is actually up, instead of a real bid on an item you
   *   never looked at.
   *
   * ── WHAT SUCCESS MEANS ───────────────────────────────────────────
   * The bid was RECORDED — not that you won. The reply names the topic the
   * price moves on, and somebody may outbid you on the very next frame. The
   * lot is yours only when the auctioneer hammers it.
   *
   * ── THE REFUSALS, AND WHICH ONES ARE WORTH RETRYING ──────────────
   *   400 `bid_too_low`      retry at `details.minimumNextBidCents`.
   *   409 `lot_closed`       hammered or skipped. Nothing to retry.
   *   409                    the auctioneer moved on from the lot you named.
   *   403 `forbidden` with `details.reason: 'physical_lot'` — this saleroom
   *       sells digital goods only. Never retryable, on any lot, ever.
   *   429 `bidding_too_fast` one person's bids on one lot are throttled so a
   *       script cannot serialise the room behind its own row lock. Wait
   *       `retryInSeconds`. Alternating between API surfaces does not raise
   *       the ceiling — it is counted per bidder, from the bids themselves.
   *   404                    no such room, or you may not enter it. The two
   *                          are one answer on purpose.
   *
   * An idempotency key is optional here, unlike checkout: a replayed bid is
   * not a second purchase, because the second attempt at the same amount is
   * below the new minimum and is refused. Send one anyway if you intend to
   * retry — replaying the stored answer beats reading `min_bid_<n>` and
   * guessing whether your first attempt landed.
   */
  bid(
    sceneId: string,
    params: { amountCents: number; lotId?: string },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/spatial/auction/rooms/${encodeURIComponent(sceneId)}/bid`,
      body: params,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}
