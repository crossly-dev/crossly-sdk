import type { HttpClient, JsonObject } from './_shared.js';

// ─── Web3: linked wallets + NFT inventory ────────────────────────────────────
export class Web3Resource {
  constructor(private http: HttpClient) {}

  /** Your verified, linked wallets. Envelope: `{ data }`. */
  listWallets() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/wallets' });
  }

  /** Start linking a wallet. Returns `{ walletId, message }`; sign `message` with the wallet. */
  createWalletChallenge(body: { family: 'evm' | 'solana'; address: string; chainId?: number }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/wallets/challenge', body });
  }

  /** Finish linking with the wallet's signature (hex on EVM, base58 on Solana). */
  verifyWallet(body: { walletId: string; signature: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/wallets/verify', body });
  }

  /** Import the wallet's NFTs into inventory; archives ones that left the wallet. */
  syncWallet(id: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/wallets/${encodeURIComponent(id)}/sync`, body: {} });
  }

  /** Unlink a wallet. Its NFTs stay in inventory but stop syncing. */
  unlinkWallet(id: string) {
    return this.http.request<JsonObject>({ method: 'DELETE', path: `/v1/web3/wallets/${encodeURIComponent(id)}` });
  }

  /** The NFT behind an inventory item and its open listings on every marketplace (`{ nft: null }` if not an NFT). */
  getInventoryNft(itemId: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/web3/inventory/${encodeURIComponent(itemId)}` });
  }

  /** NFTs in your inventory. Envelope: `{ data, pagination }`. */
  listNfts(query: { chain?: string; walletId?: string; page?: number; limit?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/nfts', query });
  }

  // ── Portfolio ──────────────────────────────────────────────────────────────

  /** Your NFTs' value and cost, realised sales, and USD P&L totals. */
  portfolio() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/portfolio' });
  }

  /** NFTs your linked wallets bought, newest first. Envelope: `{ data }`. */
  purchases() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/purchases' });
  }

  /**
   * Your collector perks: NFTs bought through Crossly (count, pin tier, relist
   * rewards paid in USD cents) and a mark per NFT you still hold.
   */
  collector() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/collector' });
  }

  /** One calendar year of NFT disposals as CSV text: `{ year, filename, csv }`. */
  taxExport(year: number) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/portfolio/tax', query: { year } });
  }

  // ── Watchlist and price alerts ─────────────────────────────────────────────

  /** Your favourited NFTs with the cheapest open Crossly listing and last sale of each. Envelope: `{ data }`. */
  watchlist() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/watchlist' });
  }

  /** Favourite an NFT, or unfavourite it if it already is. Returns `{ favorited }`. */
  toggleFavorite(body: { chain: string; contract: string; tokenId: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/favorites', body });
  }

  /** Your NFT price alerts. Envelope: `{ data }`. */
  listAlerts() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/alerts' });
  }

  /** Be notified when a token (or, without `tokenId`, anything in the collection) is listed at or below `price`, in the chain's native coin. */
  setAlert(body: { chain: string; contract: string; tokenId?: string; price: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/alerts', body });
  }

  /** Delete a price alert. */
  deleteAlert(id: string) {
    return this.http.request<JsonObject>({ method: 'DELETE', path: `/v1/web3/alerts/${encodeURIComponent(id)}` });
  }

  // ── Solana offers (Crossly book) ───────────────────────────────────────────

  /** Build a bid on a Solana NFT for your wallet to sign: `{ txs, orderHash }`. `priceSol` is a decimal SOL amount. */
  solanaOfferTx(body: { mint: string; buyer: string; priceSol: string; blockhash: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/solana/offers/tx', body });
  }

  /** Record a sent bid (checked on chain). */
  recordSolanaOffer(body: { mint: string; buyer: string; priceSol: string; signature: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/solana/offers', body });
  }

  /** Build the cancel of your bid. */
  solanaCancelOfferTx(orderHash: string, body: { blockhash: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/solana/offers/${encodeURIComponent(orderHash)}/cancel-tx`, body });
  }

  /** Build the sale into a bid from the wallet that holds the NFT. */
  solanaAcceptOfferTx(orderHash: string, body: { seller: string; blockhash: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/solana/offers/${encodeURIComponent(orderHash)}/accept-tx`, body });
  }

  /** Apply a sent accept or cancel. */
  confirmSolanaOffer(orderHash: string, body: { signature: string; action: 'accept' | 'cancel'; seller?: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/solana/offers/${encodeURIComponent(orderHash)}/confirm`, body });
  }

  // ── Phygitals ──────────────────────────────────────────────────────────────

  /** A token's phygital: the physical item it redeems for, and whether it has been. `{ phygital }`. */
  getPhygital(chain: string, contract: string, tokenId: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/web3/phygitals/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}/${encodeURIComponent(tokenId)}` });
  }

  /** Phygitals you linked and ones you redeemed. `{ linked, redeemed }`. */
  listPhygitals() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/phygitals' });
  }

  /** Make an NFT you hold redeemable for one of your physical inventory items. */
  linkPhygital(body: { chain: string; contract: string; tokenId: string; inventoryItemId: string; title: string; description?: string | null }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/phygitals', body });
  }

  /** Redeem a phygital you hold for its physical item. `shipTo.country` is ISO 3166 alpha-2. */
  redeemPhygital(id: string, shipTo: { name: string; line1: string; line2?: string | null; city: string; region?: string | null; postalCode: string; country: string; phone?: string | null }) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/phygitals/${encodeURIComponent(id)}/redeem`, body: { shipTo } });
  }

  /** Mark a redemption shipped. */
  shipPhygitalRedemption(id: string, body: { carrier: string; trackingNumber: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/phygitals/redemptions/${encodeURIComponent(id)}/ship`, body });
  }

  // ── Drops and metadata ─────────────────────────────────────────────────────

  /** Upcoming and live drops (curated mints), soonest first. Envelope: `{ data }`. */
  listDrops() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/drops' });
  }

  /** Turn a drop's 15-minute reminder on, or off if it already is. `{ remindMe }`. */
  toggleDropReminder(id: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/drops/${encodeURIComponent(id)}/remind`, body: {} });
  }

  /** Re-read a token's metadata from the provider (once per token per 10 minutes). */
  refreshTokenMetadata(chain: string, contract: string, tokenId: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/tokens/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}/${encodeURIComponent(tokenId)}/refresh`, body: {} });
  }

  // ── Auctions, bundles, private listings ────────────────────────────────────

  /** Live English auctions, ending soonest first. Envelope: `{ data }`. */
  listAuctions(query: { chain?: string; limit?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/auctions', query });
  }

  /** A token's live (or latest) auction with its top bid and minimum next bid. `{ auction }`. */
  getAuction(chain: string, contract: string, tokenId: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/web3/auctions/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}/${encodeURIComponent(tokenId)}` });
  }

  /** Start an English auction: `reserve` in the chain's native coin, `hours` 1–720. Bids are offers (`submitOrder`). */
  createAuction(body: { chain: string; contract: string; tokenId: string; reserve: string; hours: number }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/auctions', body });
  }

  /** Call off your auction while it has no bids. */
  cancelAuction(id: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/auctions/${encodeURIComponent(id)}/cancel`, body: {} });
  }

  /** Open bundle listings (2–30 NFTs for one price). Envelope: `{ data }`. */
  listBundles(query: { chain?: string; contract?: string; limit?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/bundles', query });
  }

  /** Private listings reserved for one of your linked wallets. Envelope: `{ data }`. */
  listReserved() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/reserved' });
  }

  // ── The Crossly NFT book (Seaport 1.6) ─────────────────────────────────────

  /** Open listings, cheapest per token. Envelope: `{ data, pagination }`. */
  listListings(query: { chain?: string; contract?: string; sort?: 'recent' | 'price_asc' | 'price_desc'; page?: number; limit?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/listings', query });
  }

  /** The Web3 directory's categories and chains with collection counts. */
  browse() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/browse' });
  }

  /** Browse collections by chain, category and name. `hot` ranks by Crossly sales, listings and favourites. Envelope: `{ data, meta: { total } }`. */
  browseCollections(
    query: {
      chain?: string;
      category?: 'pfps' | 'art' | 'gaming' | 'memberships' | 'virtual-worlds' | 'domains';
      q?: string;
      sort?: 'hot' | 'new' | 'volume' | 'floor' | 'name';
      listed?: boolean;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/browse/collections', query });
  }

  /** Hot NFTs: for sale on Crossly first, then tokens from the hottest collections. */
  hotTokens(query: { chain?: string; category?: 'pfps' | 'art' | 'gaming' | 'memberships' | 'virtual-worlds' | 'domains'; limit?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/browse/tokens', query });
  }

  /** The latest NFT sales across the directory (on-chain Seaport/Blur + the Crossly book), newest first; page with `before` (ISO). Envelope: `{ data }`. */
  sales(query: { chain?: string; category?: 'pfps' | 'art' | 'gaming' | 'memberships' | 'virtual-worlds' | 'domains'; limit?: number; before?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/sales', query });
  }

  /** Collections by sales volume over a window, in one coin (no chain = the ETH chains together). Envelope: `{ data, meta: { window, currency } }`. */
  rankings(query: { window?: '24h' | '7d' | '30d'; chain?: string; category?: 'pfps' | 'art' | 'gaming' | 'memberships' | 'virtual-worlds' | 'domains'; limit?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/rankings', query });
  }

  /** The NFT home's featured collections: chosen by Crossly, else the hottest (`source`). */
  featured() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/featured' });
  }

  /** Collections ranked by 30-day Crossly volume. */
  listCollections(query: { chain?: string; limit?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/collections', query });
  }

  /** Collection metadata + stats (floor, listed, volume, best collection offer). */
  getCollection(chain: string, contract: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/web3/collections/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}` });
  }

  /** On-chain insights: holders, collection-wide trait counts, recent transfers, a 30-day activity series. */
  getCollectionInsights(chain: string, contract: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/web3/collections/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}/insights` });
  }

  /**
   * A collection's NFTs. `trait` repeats as `Type:Value` (OR within a type, AND
   * across types); `q` matches a name or token id; sort by id, rarity or Crossly
   * price. Whole-collection once indexed (`indexed.status` 'done'), else a
   * provider page with `pageKey` paging.
   */
  listCollectionItems(
    chain: string,
    contract: string,
    query: { offset?: number; limit?: number; q?: string; sort?: 'id' | 'rarity' | 'price'; trait?: string[]; listed?: boolean; pageKey?: string } = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/web3/collections/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}/items`,
      query,
    });
  }

  /** Every trait type and value in a collection, with how many tokens have each. */
  getCollectionTraits(chain: string, contract: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/web3/collections/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}/traits` });
  }

  /** A collection from its readable URL: chain (eth, sol, … or full) and slug (e.g. boredapeyachtclub). */
  resolveCollection(chain: string, slug: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/web3/resolve/${encodeURIComponent(chain)}/${encodeURIComponent(slug)}` });
  }

  /** One NFT with its listings, offers and activity. */
  getToken(chain: string, contract: string, tokenId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/web3/tokens/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}/${encodeURIComponent(tokenId)}`,
    });
  }

  /** Listings, offers, sales and cancels, newest first. */
  listActivity(query: { chain?: string; contract?: string; tokenId?: string; limit?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/activity', query });
  }

  /** Your orders in the book, any status. */
  listMyOrders() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/orders' });
  }

  /** Place a signed Seaport order (`components` = OrderComponents with `counter`). */
  submitOrder(body: { chain: string; components: JsonObject; signature: string; criteria?: { traitType: string; value: string; tokenIds: string[] } }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/orders', body });
  }

  /** Take one of your orders out of the book. */
  cancelOrder(chain: string, orderHash: string) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/web3/orders/${encodeURIComponent(chain)}/${encodeURIComponent(orderHash)}/cancel`,
      body: {},
    });
  }

  /** The signed order to pass to Seaport's fulfillOrder. */
  getFulfillment(chain: string, orderHash: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/web3/orders/${encodeURIComponent(chain)}/${encodeURIComponent(orderHash)}/fulfillment`,
    });
  }

  /** Fulfilments for sweeping several listings in one transaction. */
  getFulfillmentBatch(body: { chain: string; orderHashes: string[] }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/orders/fulfillment-batch', body });
  }

  /** Token ids in a collection with one trait (what a trait offer commits to). */
  getTraitTokens(chain: string, contract: string, query: { type: string; value: string }) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/web3/collections/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}/trait-tokens`,
      query,
    });
  }

  /** A wallet's public profile: NFTs held, open Crossly listings, activity. */
  getProfile(address: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/web3/profiles/${encodeURIComponent(address)}` });
  }

  /** Find collections by contract address or name. */
  searchCollections(q: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/search', query: { q } });
  }

  /** The collection's Crossly book by price level (asks, bids, running totals) and every trait value's floor. */
  collectionDepth(chain: string, contract: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/web3/collections/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}/depth` });
  }

  /** Daily floor, sales, volume, holders and listed count, oldest first (`days` ≤ 365). Envelope: `{ data }`. */
  collectionHistory(chain: string, contract: string, query: { days?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/web3/collections/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}/history`, query });
  }

  /** Find tokens by collection name and number ("pudgy 42"). Envelope: `{ data }`. */
  searchTokens(q: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/search/tokens', query: { q } });
  }

  // ── Cross-listing ──────────────────────────────────────────────────────────

  /** Each marketplace's terms for listing a token (Crossly fee, OpenSea required fees + zone, Tensor). */
  crossListQuote(query: { chain: string; contract: string; tokenId: string }) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/crosslist/quote', query });
  }

  /** Submit signed listings for several marketplaces at once. Envelope: `{ data: results[] }`. */
  crossList(body: { chain: string; orders: Array<{ marketplace: 'crossly' | 'opensea'; components: JsonObject; signature: string }> }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/crosslist', body });
  }

  // ── Solana: the Crossly book, Tensor, Magic Eden (unsigned transactions your wallet signs) ─

  /** Build an unsigned listing transaction (base64) on the Crossly book (Crossly's own Auction House), Tensor or Magic Eden. */
  solanaListTransaction(marketplace: 'crossly' | 'tensor' | 'magic_eden', body: { mint: string; owner: string; priceSol: string; blockhash: string; expireInDays?: number }) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/solana/${encodeURIComponent(marketplace)}/list-tx`, body });
  }

  /** Record a Solana listing your wallet sent. */
  recordSolanaListing(marketplace: 'crossly' | 'tensor' | 'magic_eden', body: { mint: string; owner: string; priceSol: string; signature: string; expireInDays?: number }) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/solana/${encodeURIComponent(marketplace)}/listings`, body });
  }

  /** Build the transaction that takes your Solana listing down. */
  solanaDelistTransaction(orderHash: string, body: { blockhash: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/solana/orders/${encodeURIComponent(orderHash)}/delist-tx`, body });
  }

  /** Build the transaction that buys a Solana listing. */
  solanaBuyTransaction(orderHash: string, body: { buyer: string; blockhash: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/solana/orders/${encodeURIComponent(orderHash)}/buy-tx`, body });
  }

  /** Apply a sent Solana buy or delist to the book. */
  confirmSolanaTransaction(orderHash: string, body: { signature: string; action: 'buy' | 'delist'; buyer?: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/solana/orders/${encodeURIComponent(orderHash)}/confirm`, body });
  }

  // ── Rarible (its own EIP-712 order: draft, sign with your wallet, submit) ─

  /** Draft a Rarible V2 listing: the EIP-712 order to sign and whether Rarible's transfer proxy is approved. `priceWei` is the native coin, in wei. */
  raribleDraft(body: { chain: 'ethereum' | 'base' | 'polygon' | 'arbitrum'; maker: string; contract: string; tokenId: string; standard: 'erc721' | 'erc1155'; priceWei: string; days: number }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/rarible/draft', body });
  }

  /** Submit the signed draft order (the draft's `order` fields plus `signature`); verified, posted to Rarible, recorded. */
  submitRaribleListing(body: {
    chain: 'ethereum' | 'base' | 'polygon' | 'arbitrum';
    maker: string;
    contract: string;
    tokenId: string;
    standard: 'erc721' | 'erc1155';
    priceWei: string;
    salt: string;
    start: number;
    end: number;
    signature: string;
  }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/rarible/listings', body });
  }

  // ── Your own marketplace API keys (optional; Crossly's keys are the fallback) ─

  /** Per marketplace: whether Crossly's key covers it and your key's last four characters. Envelope: `{ data: [...] }`. */
  listMarketplaceKeys() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/marketplace-keys' });
  }

  /** Save your own API key for a marketplace (checked with the marketplace first where possible; stored encrypted). */
  setMarketplaceKey(marketplace: 'opensea' | 'tensor' | 'magic_eden' | 'rarible', body: { apiKey: string }) {
    return this.http.request<JsonObject>({ method: 'PUT', path: `/v1/web3/marketplace-keys/${encodeURIComponent(marketplace)}`, body });
  }

  /** Remove your own key for a marketplace. */
  deleteMarketplaceKey(marketplace: 'opensea' | 'tensor' | 'magic_eden' | 'rarible') {
    return this.http.request<JsonObject>({ method: 'DELETE', path: `/v1/web3/marketplace-keys/${encodeURIComponent(marketplace)}` });
  }

  /** Collections the OpenSea conduit may move, per linked wallet. */
  listApprovals() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/approvals' });
  }

  // ── Launchpad, holder perks, creator dashboard ────────────────────────────

  /** Your launchpad collections (drafts and live). Envelope: `{ data }`. */
  listLaunches() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/launches' });
  }

  /** Draft a launchpad collection (price in wei; Crossly takes 5% of each mint in the contract). */
  createLaunch(body: JsonObject) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/launches', body });
  }

  /** The draft's contract-creation transaction `{ chain, from, data }`, for the owner wallet to send. */
  launchDeployTx(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/web3/launches/${encodeURIComponent(id)}/deploy-tx` });
  }

  /** Confirm the sent deploy; the launch goes live once the contract checks out. */
  confirmLaunchDeploy(id: string, txHash: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/launches/${encodeURIComponent(id)}/confirm-deploy`, body: { txHash } });
  }

  /** Delete a draft that never went live. */
  deleteLaunchDraft(id: string) {
    return this.http.request<JsonObject>({ method: 'DELETE', path: `/v1/web3/launches/${encodeURIComponent(id)}` });
  }

  /** Your holder perks. Envelope: `{ data }`. */
  listHolderPerks() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/holder-perks' });
  }

  /** Give holders of a collection a percent off your shop (100–5000 bps). */
  setHolderPerk(body: { chain: string; contract: string; percentOffBps: number; active?: boolean }) {
    return this.http.request<JsonObject>({ method: 'PUT', path: '/v1/web3/holder-perks', body });
  }

  /** Remove a holder perk. */
  deleteHolderPerk(id: string) {
    return this.http.request<JsonObject>({ method: 'DELETE', path: `/v1/web3/holder-perks/${encodeURIComponent(id)}` });
  }

  /** Collections you are the creator of. Envelope: `{ data }`. */
  creatorCollections() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/web3/creator/collections' });
  }

  /** Claim an EVM collection whose owner() is one of your verified wallets. */
  claimCollection(body: { chain: string; contract: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/creator/claims', body });
  }

  /** A collection's creator dashboard (sales, royalties, holders, mint revenue). */
  creatorDashboard(chain: string, contract: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/web3/creator/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}` });
  }

  /** A launch's creator tools: allowlist, art and reveal, supply minted. */
  launchTools(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/web3/launches/${encodeURIComponent(id)}/tools` });
  }

  /** Replace a launch's early-phase allowlist; EVM live launches get back `rootTx` for the owner wallet. */
  setLaunchAllowlist(id: string, addresses: string[]) {
    return this.http.request<JsonObject>({ method: 'PUT', path: `/v1/web3/launches/${encodeURIComponent(id)}/allowlist`, body: { addresses } });
  }

  /** The setAllowlistRoot transaction for the allowlist Crossly holds (EVM, live). */
  launchAllowlistRootTx(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/web3/launches/${encodeURIComponent(id)}/allowlist/root-tx` });
  }

  /** Append per-token art before the reveal. */
  addLaunchArt(id: string, items: Array<{ imageUrl: string; name?: string; attributes?: Array<{ trait_type: string; value: string | number }> }>) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/launches/${encodeURIComponent(id)}/art`, body: { items } });
  }

  /** Reveal a launch's art (one random offset, for good). */
  revealLaunch(id: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/launches/${encodeURIComponent(id)}/reveal` });
  }

  /** Plan an airdrop to `addresses` and/or the holders of `holdersOf`; returns the owner's transactions. */
  planLaunchAirdrop(id: string, body: { addresses?: string[]; holdersOf?: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/launches/${encodeURIComponent(id)}/airdrop`, body });
  }

  /** A Solana collection's Tensor bids (collection-wide and by trait). */
  solanaTensorBids(collection: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/web3/solana/collections/${encodeURIComponent(collection)}/tensor-bids` });
  }

  /** Build a Tensor collection or trait bid for your Solana wallet to sign. */
  placeSolanaTensorBid(body: JsonObject) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/solana/tensor-bids/place-tx', body });
  }

  /** Build the transaction that sells your NFT into a Tensor bid. */
  acceptSolanaTensorBid(body: JsonObject) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/solana/tensor-bids/accept-tx', body });
  }

  /** Build the transaction that cancels your Tensor bid. */
  cancelSolanaTensorBid(body: JsonObject) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/solana/tensor-bids/cancel-tx', body });
  }

  /** Make your Space holders-only (null opens it again). */
  setSpaceHolderGate(slug: string, gate: { chain: string; contract: string } | null) {
    return this.http.request<JsonObject>({ method: 'PUT', path: `/v1/world/spaces/${encodeURIComponent(slug)}/holder-gate`, body: gate as JsonObject | null });
  }

  /** Make your room holders-only (null opens it again). */
  setRoomHolderGate(id: string, gate: { chain: string; contract: string } | null) {
    return this.http.request<JsonObject>({ method: 'PUT', path: `/v1/world/rooms/${encodeURIComponent(id)}/holder-gate`, body: gate as JsonObject | null });
  }

  /** The NFT you wear on your nameplate in the world. */
  nftBadge() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/world/avatar/nft-badge' });
  }

  /** Wear an NFT you hold on your nameplate (null to take it off). */
  setNftBadge(badge: { chain: string; contract: string; tokenId: string } | null) {
    return this.http.request<JsonObject>({ method: 'PUT', path: '/v1/world/avatar/nft-badge', body: badge as JsonObject | null });
  }

  /** Pin one of your live launches on your live show. */
  pinLaunchOnStream(streamId: string, launchId: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/live-streams/${encodeURIComponent(streamId)}/pin-launch`, body: { launchId } });
  }

  /** Unpin the launch from your live show. */
  unpinLaunchOnStream(streamId: string) {
    return this.http.request<JsonObject>({ method: 'DELETE', path: `/v1/live-streams/${encodeURIComponent(streamId)}/pin-launch` });
  }

  /** Follow a launch's creator: their launches are announced to you. */
  followLaunchCreator(launchId: string) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/web3/launches/${encodeURIComponent(launchId)}/follow-creator` });
  }

  /** Stop following a launch's creator. */
  unfollowLaunchCreator(launchId: string) {
    return this.http.request<JsonObject>({ method: 'DELETE', path: `/v1/web3/launches/${encodeURIComponent(launchId)}/follow-creator` });
  }

  /** Apply a Seaport transaction's fills/cancels to the book. */
  confirmTransaction(body: { chain: string; txHash: string }) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/web3/transactions', body });
  }
}
