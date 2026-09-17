/**
 * Resource namespaces. One class per `/api/v1/*` domain.
 *
 * Every method maps 1:1 to an endpoint — params become query strings or
 * JSON bodies based on the verb. Returns are typed as the loose
 * `JsonObject` shape since the v1 server is the source of truth for
 * response schemas. Mutation methods accept `opts.idempotencyKey` —
 * pass one on retries.
 *
 * Implementations are grouped by domain in resources/. Existing
 * `from '@crosslister/sdk/dist/resources.js'` imports continue to work
 * via this barrel.
 */
export * from './resources/catalog.js';
export * from './resources/catalog-lookup.js';
export * from './resources/market.js';
export * from './resources/embeds.js';
export * from './resources/orders.js';
export * from './resources/comms.js';
export * from './resources/automation.js';
export * from './resources/account.js';
export * from './resources/discovery.js';
export * from './resources/action-log.js';
export * from './resources/offers.js';
export * from './resources/policy-presets.js';
export * from './resources/devices.js';
export * from './resources/payout.js';
export * from './resources/variation-groups.js';
export * from './resources/units.js';
export * from './resources/evidence.js';
export * from './resources/spatial.js';
export * from './resources/wholesale.js';
export * from './resources/cbx.js';
// Offsite ads. A separate product from the cashback rails; the budget is
// denominated in CBX but networks, creative and attribution are not
// token concerns.
export * from './resources/ads.js';
export * from './resources/buyer.js';
