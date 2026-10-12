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
export * from './resources/ai-images.js';
export * from './resources/catalog-lookup.js';
export * from './resources/market.js';
export * from './resources/embeds.js';
export * from './resources/scan.js';
export * from './resources/orders.js';
export * from './resources/comms.js';
export * from './resources/automation.js';
export * from './resources/account.js';
export * from './resources/membership.js';
export * from './resources/discovery.js';
export * from './resources/action-log.js';
export * from './resources/offers.js';
export * from './resources/trade-block.js';
export * from './resources/seller-xmarket.js';
export * from './resources/production.js';
export * from './resources/grading.js';
export * from './resources/stalls.js';
export * from './resources/neighbourhoods.js';
export * from './resources/homes.js';
export * from './resources/reputation.js';
export * from './resources/world-live.js';
export * from './resources/drops.js';
export * from './resources/spatial-emotes.js';
export * from './resources/spatial-party.js';
export * from './resources/games.js';
export * from './resources/world.js';
export * from './resources/world-places.js';
export * from './resources/world-conventions.js';
export * from './resources/spatial-rooms.js';
export * from './resources/world-creator.js';
export * from './resources/world-capabilities.js';
export * from './resources/world-contests.js';
export * from './resources/world-games.js';
export * from './resources/world-account.js';
export * from './resources/world-streets.js';
export * from './resources/world-spaces.js';
export * from './resources/world-parties.js';
export * from './resources/world-homes.js';
export * from './resources/world-hunt.js';
export * from './resources/world-trials.js';
export * from './resources/world-arcade.js';
export * from './resources/world-wishes.js';
export * from './resources/world-fireflies.js';
export * from './resources/world-lanterns.js';
export * from './resources/world-kites.js';
export * from './resources/world-hall.js';
export * from './resources/world-aurora.js';
export * from './resources/world-grails.js';
export * from './resources/world-provenance.js';
export * from './resources/world-chests.js';
export * from './resources/nft-market.js';
export * from './resources/web3.js';
export * from './resources/policy-presets.js';
export * from './resources/catalog-matches.js';
export * from './resources/storefront-shipping.js';
export * from './resources/brand-drops.js';
export * from './resources/devices.js';
export * from './resources/payout.js';
export * from './resources/variation-groups.js';
export * from './resources/passports.js';
export * from './resources/live-shows.js';
export * from './resources/loyalty-looks.js';
export * from './resources/pricing.js';
export * from './resources/video-requests.js';
export * from './resources/rentals.js';
export * from './resources/buyer/wave3.js';
export * from './resources/units.js';
export * from './resources/evidence.js';
export * from './resources/spatial.js';
export * from './resources/spatial-auction.js';
export * from './resources/spatial-employee.js';
export * from './resources/wholesale.js';
export * from './resources/vault-markets.js';
export * from './resources/vault-markets-pro.js';
// Their types already come through vault-markets.js; only the classes here.
export { VaultMarketsLiquidityResource } from './resources/vault-markets-liquidity.js';
export { VaultMarketsCreditResource } from './resources/vault-markets-credit.js';
export { VaultMarketsAnalyticsResource } from './resources/vault-markets-analytics.js';
export { VaultMarketsOpsResource } from './resources/vault-markets-ops.js';
export { VaultMarketsGradingResource } from './resources/vault-markets-grading.js';
export { VaultMarketsSocialResource } from './resources/vault-markets-social.js';
export { VaultMarketsSupplyResource } from './resources/vault-markets-supply.js';
export { VaultMarketsChannelsResource } from './resources/vault-markets-channels.js';
export { VaultMarketsStatsResource } from './resources/vault-markets-stats.js';
export { VaultMarketsIndexResource } from './resources/vault-markets-index.js';
export { VaultMarketsReportsResource } from './resources/vault-markets-reports.js';
export { VaultMarketsTitleResource } from './resources/vault-markets-title.js';
export { VaultMarketsInstResource } from './resources/vault-markets-inst.js';
export { VaultMarketsMmResource } from './resources/vault-markets-mm.js';
export { VaultMarketsAdlResource } from './resources/vault-markets-adl.js';
export { VaultMarketsCurvePoolsResource } from './resources/vault-markets-curve-pools.js';
export { VaultMarketsBullionResource } from './resources/vault-markets-bullion.js';
export { VaultMarketsP2pResource } from './resources/vault-markets-p2p.js';
export { VaultMarketsPmResource } from './resources/vault-markets-pm.js';
export { VaultMarketsReceiptTokensResource } from './resources/vault-markets-receipt-tokens.js';
export { VaultMarketsMarksResource } from './resources/vault-markets-marks.js';
export { VaultMarketsGradeToVaultResource } from './resources/vault-markets-grade-to-vault.js';
export { VaultMarketsHallResource } from './resources/vault-markets-hall.js';
export { VaultMarketsAgentResource } from './resources/vault-markets-agent.js';
export { VaultMarketsPaperResource } from './resources/vault-markets-paper.js';
export { VaultMarketsModeResource } from './resources/vault-markets-mode.js';
export { VaultMarketsUnitStoryResource } from './resources/vault-markets-unit-story.js';
export { VaultMarketsAlertsHubResource } from './resources/vault-markets-alerts-hub.js';
export { VaultMarketsFollowsResource } from './resources/vault-markets-follows.js';
export { VaultMarketsFloorResource } from './resources/vault-markets-floor.js';
export { VaultMarketsSetGoalsResource } from './resources/vault-markets-set-goals.js';
export { VaultMarketsValuationResource } from './resources/vault-markets-valuation.js';
export { VaultMarketsJointTodResource } from './resources/vault-markets-joint-tod.js';
export { VaultMarketsVaultSuggestResource } from './resources/vault-markets-vault-suggest.js';
export { VaultMarketsHealthResource } from './resources/vault-markets-health.js';
export { VaultMarketsTaxLossResource } from './resources/vault-markets-tax-loss.js';
export { VaultMarketsHomeResource } from './resources/vault-markets-home.js';
export { VaultMarketsPriceWidgetsResource } from './resources/vault-markets-price-widgets.js';
export { VaultMarketsPopReportsResource } from './resources/vault-markets-pop-reports.js';
export { VaultMarketsWidgetResource } from './resources/vault-markets-widget.js';
export { VaultMarketsOracleDcmResource } from './resources/vault-markets-oracle-dcm.js';
export { VaultMarketsWorldResource } from './resources/vault-markets-world.js';
export * from './resources/cbx.js';
// The CBX sub-resources. They live in resources/cbx/ and were absent from
// this barrel as well as from the client, so nothing outside the package
// could name their types either.
export * from './resources/cbx/ads.js';
export * from './resources/cbx/credit.js';
export * from './resources/cbx/rewards.js';
export * from './resources/cbx/staking.js';
export * from './resources/cbx/wallet-payments.js';
// Offsite ads. A separate product from the cashback rails; the budget is
// denominated in CBX but networks, creative and attribution are not
// token concerns.
export * from './resources/ads.js';

// COSM. Its own resource because it is its own token — minted on demand,
// backed by nothing, burned on spend. The inverse of CBX in every
// respect that matters.
export * from './resources/cosm.js';

// The DAO. Governance over the events pool, weighted by staked CBX.
export * from './resources/dao.js';
export * from './resources/buyer.js';
