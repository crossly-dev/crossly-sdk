import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Crossly World: your wallet, quests, crew, wardrobe and boards ───────────
//
// What a person has, wears and is doing in Crossly World, plus the verbs that
// move no money: wear a quest pin, start / join / leave a crew, invite a friend
// to your room, equip or unequip something you already own, and the auto-shop
// switch. Buying cosmetics, buying with CBX, minting to a wallet and shaking on
// a trade are NOT on the public API -- an app token never moves CBX, COSM or
// money; those stay on crossly.net.
//
// Base-unit amounts (CBX, COSM) are STRINGS: they overflow a JSON number.

export type AvatarSlot = 'avatar_head' | 'avatar_body' | 'avatar_outer' | 'avatar_legs' | 'avatar_feet' | 'avatar_back';

export interface WorldWallet {
  bucksCents: number;
  /** available:false = CBX is not provisioned on this deployment (not "you have none"). */
  cbx:
    | { available: false }
    | {
        available: true;
        decimals: number;
        /** Ad credit, promos, quest rewards: spend in-platform only. Base units. */
        granted: string;
        /** Cashback: withdrawable once matured. Base units. */
        earned: string;
        /** A delegation CEILING on your own wallet, not cash on hand. Base units. */
        connected: string;
        /** Cashback not yet matured, in cents. */
        pendingCents: number;
      };
  cosm: { available: false } | { available: true; decimals: number; baseUnits: string };
}

export interface WorldQuest {
  key: string;
  /** The pin finishing it earns. */
  pin: string;
  goal: string;
  target: number;
  count: number;
  done: boolean;
  colour: string;
}

export interface WorldCrew {
  /** `homeSlug`: the crew's hangout, its owner's home (null when they have none or it is locked). */
  crew: { name: string; tag: string; code: string; owner: boolean; homeSlug?: string | null } | null;
  members: Array<{ userId: string; name: string; you: boolean; room: { slug: string; name: string } | null }>;
}

/** Emote wheel slots: an emote id, a moment slot, or empty. */
export type EmoteWheelSlots = Array<string | null>;
/** Someone you follow. */
export interface WorldFollow { userId: string; displayName: string | null; mutual: boolean; followedAt: string }
/** A public room of somebody you follow (the api's shape, passed through). */
export type WorldFollowedRoom = Record<string, unknown>;
/** The jobs board (open shifts, yours, price checks), as the world shows it. */
export type WorldJobsBoard = Record<string, unknown>;
/** A shift you posted. */
export type WorldPostedShift = Record<string, unknown>;

/** Leaderboards among your crew: per period, one board per game. */
export interface CrewLeaderboards {
  week: Array<{ game: string; period: 'week' | 'all'; label: string; unit: string; rows: Array<{ rank: number; name: string; short: string; named: boolean; value: number; score?: number }> }>;
  all: CrewLeaderboards['week'];
  weekStartsAt: string;
}

/** A friend you can message, with the last line between you and your unread count. */
export interface DmThreadSummary { userId: string; name: string; last: { text: string; at: string; mine: boolean } | null; unread: number }
/** One direct message. */
export interface DmLine { id: string; from: string; text: string; at: string; mine: boolean }

/** One line of crew chat. */
export interface CrewChatLine { from: string; name: string; text: string; at: number }
/** The crew chat ring (last 50 lines, in memory), and your line when one went out. */
export interface CrewChat { messages: CrewChatLine[]; said?: CrewChatLine }

export interface WorldLoadout {
  rigKey: string;
  slots: AvatarSlot[];
  worn: Array<{
    slot: AvatarSlot;
    kind: 'cosmetic' | 'item';
    equippedAt: string;
    cosmetic: Record<string, unknown> | null;
    item: { title: string; imageUrl: string | null; marketSkuId: string | null; marketVariantId: string | null; identifiers: unknown[] } | null;
    /** The verified-purchase mark (null for a cosmetic). */
    mark: { verified: boolean; verdict: string; purchasedAt: string | null; matchedIdentifier: string | null; sourcePlatform: string | null } | null;
  }>;
}

export interface ClosetItem {
  receiptId: string;
  itemTitle: string;
  itemBrand: string | null;
  itemSize: string | null;
  itemImageUrl: string | null;
  marketSkuId: string | null;
  marketVariantId: string | null;
  identifierKeys: string[];
  quantity: number;
  purchasedAt: string;
  sourcePlatform: string;
}

export interface StockWearable { inventoryItemId: string; title: string; imageUrl: string | null; slot: string }

export interface AuthoredWearable {
  id: string;
  sku: string;
  name: string;
  slot: string;
  /** COSM base units, a string. */
  priceBaseUnits: string | null;
  maxSupply: number | null;
  mintedCount: number;
  active: boolean;
  createdAt: string;
}

export interface CosmBalance { available: boolean; reason?: string; subjectId: string | null; baseUnits: string; decimals: number }

export interface CosmCatalogueItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  slot: string;
  tier: 'premium' | 'earned' | 'stake_exclusive';
  /** Set only on premium. Cents. */
  priceCents: number | null;
  /** Set only on earned. COSM base units, a string. */
  priceBaseUnits: string | null;
  minStakeTenureDays: number | null;
  maxSupply: number | null;
  mintedCount: number;
  fusable: boolean;
  previewImageUrl: string | null;
  unlocksKey: string | null;
  unlocksValue: string | null;
}

export interface CosmHolding {
  ownershipId: string;
  cosmeticId: string;
  sku: string;
  name: string;
  slot: string;
  tier: string;
  acquiredVia: string;
  bound: boolean;
  editionNumber: number | null;
  acquiredAt: string;
  fusable: boolean;
  previewImageUrl: string | null;
  unlocksKey: string | null;
  unlocksValue: string | null;
}

export interface BinderItem {
  key: string;
  variantId: string;
  condition: string;
  gradeKey: string | null;
  portfolioId: string | null;
  name: string;
  imageUrl: string | null;
  /** Market value, cents. */
  valueCents: number;
}

export interface FriendHere { userId: string; displayName: string | null; room: { slug: string; name: string } | null; homeSlug: string | null }

export interface FitValue { cents: number; pieces: number; priced: number; share: boolean }
export interface FitStats { days: number; people: number; shops: number; offers: number }

export interface AutoShopStatus {
  enabled: boolean;
  shop: { id: string; name: string; visibility: string; autoCreated: boolean; address: string | null; label: string | null } | null;
}

/** Exactly one door: a cosmetic you hold, a purchase receipt, or your own stock. */
export type EquipBody =
  | { cosmeticId: string }
  | { receiptId: string; slot?: AvatarSlot }
  | { inventoryItemId: string; slot?: AvatarSlot };

/** A trade listing a trade table can be opened on. */
export interface TradeTableListing { id: string; items: string[] }
/** One of this week's best-dressed. */
export interface BestDressedEntry { name: string; profile: string | null; loves: number }
/** A current daily visit streak. */
export interface StreakEntry { name: string; days: number }

/** The creator's closed vocabulary: skin, hair, hairColour, eyes, build (keys, not colours). */
export interface AvatarAppearance { skin: string; hair: string; hairColour: string; eyes: string; build: string }

/** One worn thing in a saved look, by the door it goes back on by. */
export interface OutfitItem { slot: AvatarSlot; door: 'cosmetic' | 'receipt' | 'stock'; id: string; label: string }

/** A saved look (up to 6 per account). */
export interface OutfitPreset { id: string; name: string; appearance: AvatarAppearance; items: OutfitItem[]; createdAt: string; updatedAt: string }

export interface OutfitSaved { preset: OutfitPreset; skipped: string[] }

export interface OutfitApplied { appearance: AvatarAppearance; applied: string[]; skipped: Array<{ label: string; reason: string }>; cleared: string[] }

export type DecorSurface = 'avatar' | 'home' | 'shop' | 'stall' | 'street';

/** Whether "Mint as NFT" is open on this deployment, and why not when it is not. */
export interface DecorMintAvailability { open: boolean; reason: string | null }

/** One shelf item in the Decor Shop (GET /v1/world/decor/catalogue). */
export interface DecorShopItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  surface: DecorSurface;
  slot: string;
  tier: 'premium' | 'earned' | 'stake_exclusive' | string;
  /** Premium: the dollar price in cents, paid in CBX at spot on crossly.net. */
  priceCents: number | null;
  /** Earned: COSM in base units (6 decimals), as a string. */
  priceBaseUnits: string | null;
  maxSupply: number | null;
  mintedCount: number;
  remaining: number | null;
  soldOut: boolean;
  previewImageUrl: string | null;
  tint: string | null;
  meshProfile: string | null;
  unlocksKey: string | null;
  unlocksValue: string | null;
  ugc: boolean;
  buyWith: Array<'cbx' | 'cosm'>;
  owned: boolean;
  ownershipId: string | null;
  editionNumber: number | null;
}

/** Decor you hold or have minted (GET /v1/world/decor/mine). */
export interface MyDecorItem {
  ownershipId: string;
  cosmeticId: string;
  sku: string;
  name: string;
  surface: DecorSurface;
  slot: string;
  tier: string;
  acquiredVia: string;
  bound: boolean;
  editionNumber: number | null;
  maxSupply: number | null;
  acquiredAt: string;
  previewImageUrl: string | null;
  tint: string | null;
  unlocksKey: string | null;
  unlocksValue: string | null;
  mintState: 'held' | 'minting' | 'minted';
  mintAddress: string | null;
  mintable: boolean;
}

/** A place you dress with decor (GET /v1/world/decor/inventory). */
export interface DecorSpace { kind: 'home' | 'shop' | 'stall' | 'street'; id: string; name: string }

/** Where copies of one decor item are in use. */
export interface DecorPlacement { space: DecorSpace; count: number }

/** One owned copy of a decor item. */
export interface DecorCopy { ownershipId: string; editionNumber: number | null }

/**
 * One decor item as an inventory line. Decor is a quantity: a placed prop
 * uses one copy per placement, a finish one copy per space it dresses.
 */
export interface DecorInventoryItem {
  key: string;
  value: string;
  /** `key:value`. */
  pair: string;
  name: string;
  sku: string | null;
  surface: DecorSurface;
  placeable: boolean;
  tint: string | null;
  owned: number;
  placed: number;
  available: number;
  placements: DecorPlacement[];
  copies: DecorCopy[];
}

export interface DecorInventoryMeta { available?: boolean; reason?: string; spaces?: DecorSpace[] }

export interface DecorInventoryPage { data: DecorInventoryItem[]; meta?: DecorInventoryMeta }

/** One interactive piece (GET /v1/world/interactive/catalogue): runs a shared script in a room. */
export interface InteractiveCatalogueItem {
  /** The piece key a home layout or boutique prop stores. */
  model: string;
  /** The home_prop value its SKU claims. */
  decorValue: string;
  source: 'first_party' | 'creator';
  name: string;
  blurb: string | null;
  /** Floor footprint [x, z], metres. */
  size: [number, number];
  fallbackMesh: string;
  /** The Decor Shop SKU, null when not on sale. */
  cosmeticId: string | null;
  /** A creator design: the approved version every copy runs. */
  version: number | null;
}

/** One of your interactive-object designs (GET /v1/world/interactive/designs). */
export interface InteractiveDesign {
  id: string;
  handle: string;
  name: string;
  description: string | null;
  footprint: 's' | 'm' | 'l' | 'f';
  tint: string;
  /** COSM, base-unit string. */
  priceBaseUnits: string;
  maxSupply: number | null;
  model: string;
  decorValue: string;
  cosmeticId: string | null;
  /** The approved version every copy runs; null = none. */
  liveVersion: number | null;
  withdrawnReason: string | null;
  /** You archived it: off sale, owned copies keep running its last approved version. Null = not archived. */
  archivedAt: string | null;
  latestVersion: { version: number; state: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'cancelled'; decisionNote: string | null } | null;
  inReview: boolean;
  draftUpdatedAt: string;
  createdAt: string;
}

export class WorldResource {
  constructor(private http: HttpClient) {}

  // ── reads (activity:read; autoShop is inventory:read) ──

  /** Every balance you hold: Bucks, the three CBX balances kept apart, COSM. */
  wallet() {
    return this.http.request<{ data: WorldWallet }>({ method: 'GET', path: '/v1/world/wallet' });
  }

  /** Every quest with your progress; meta carries the pin you wear and your visit streak. */
  quests() {
    return this.http.request<{ data: WorldQuest[]; meta?: { wearing?: string | null; streak?: { days: number; best: number } } }>({ method: 'GET', path: '/v1/world/quests' });
  }

  /** Your crew (null when none) and its members, each with the public room they are in. */
  crew() {
    return this.http.request<{ data: WorldCrew }>({ method: 'GET', path: '/v1/world/crew' });
  }

  /** The game leaderboards ranked among your crew only (404 when you are in no crew). */
  crewLeaderboards() {
    return this.http.request<{ data: CrewLeaderboards }>({ method: 'GET', path: '/v1/world/crew/leaderboards' });
  }

  /** Everybody you follow, each with whether they follow you back. */
  follows() {
    return this.http.request<{ data: WorldFollow[] }>({ method: 'GET', path: '/v1/world/follows' });
  }

  /** Follow somebody (mutual follows are friends). */
  follow(userId: string) {
    return this.http.request<{ data: { following: boolean } }>({ method: 'POST', path: `/v1/world/follows/${encodeURIComponent(userId)}`, body: {} });
  }

  /** Unfollow somebody. */
  unfollow(userId: string) {
    return this.http.request<{ data: { following: boolean } }>({ method: 'DELETE', path: `/v1/world/follows/${encodeURIComponent(userId)}` });
  }

  /** Public rooms of people you follow. */
  followingRooms() {
    return this.http.request<{ data: WorldFollowedRoom[] }>({ method: 'GET', path: '/v1/world/following/rooms' });
  }

  /** The jobs board: open shifts, your claimed shifts, open price checks. */
  jobs() {
    return this.http.request<{ data: WorldJobsBoard }>({ method: 'GET', path: '/v1/world/jobs' });
  }

  /** Shifts you posted for your rooms. */
  postedJobs() {
    return this.http.request<{ data: WorldPostedShift[] }>({ method: 'GET', path: '/v1/world/jobs/posted' });
  }

  /** Arrange your emote wheel (emote ids, moment slots or null). */
  setEmoteWheel(wheel: EmoteWheelSlots) {
    return this.http.request<{ data: { wheel: EmoteWheelSlots } }>({ method: 'PUT', path: '/v1/world/emotes/wheel', body: { wheel } });
  }

  /** Walk one of your pets with you, or none. */
  setActivePet(kind: string | null) {
    return this.http.request<{ data: { active: string | null } }>({ method: 'PUT', path: '/v1/world/pets/active', body: { kind } });
  }

  /** Friends you can message (mutual follows), most recent conversation first. */
  dms() {
    return this.http.request<{ data: DmThreadSummary[] }>({ method: 'GET', path: '/v1/world/dms' });
  }

  /** Your direct-message thread with one friend, oldest first (marks theirs read). */
  dmThread(userId: string) {
    return this.http.request<{ data: DmLine[] }>({ method: 'GET', path: `/v1/world/dms/${encodeURIComponent(userId)}` });
  }

  /** Send a direct message to a friend (friends only; never across a block). */
  sendDm(userId: string, text: string) {
    return this.http.request<{ data: DmLine }>({ method: 'POST', path: `/v1/world/dms/${encodeURIComponent(userId)}`, body: { text } });
  }

  /** Your crew's chat: the last 50 lines (404 when you are in no crew). */
  crewChat() {
    return this.http.request<{ data: CrewChat }>({ method: 'GET', path: '/v1/world/crew/chat' });
  }

  /** What you are wearing -- or, with a user id, what they are wearing. */
  loadout(userId?: string) {
    if (userId) return this.http.request<{ data: WorldLoadout }>({ method: 'GET', path: `/v1/world/avatar/loadout/${encodeURIComponent(userId)}` });
    return this.http.request<{ data: WorldLoadout }>({ method: 'GET', path: '/v1/world/avatar/loadout' });
  }

  /** Purchases you can verifiably wear, newest first. */
  closet(params: { limit?: number; offset?: number } = {}) {
    const query: Record<string, string> = {};
    if (params.limit !== undefined) query.limit = String(params.limit);
    if (params.offset !== undefined) query.offset = String(params.offset);
    return this.http.request<{ data: ClosetItem[]; meta?: { offset?: number } }>({ method: 'GET', path: '/v1/world/avatar/closet', query });
  }

  /** Items of your own stock you could wear as a walking storefront. */
  stockWearables() {
    return this.http.request<{ data: StockWearable[] }>({ method: 'GET', path: '/v1/world/avatar/stock' });
  }

  /** Wearables you authored as a designer. */
  authoredWearables() {
    return this.http.request<{ data: AuthoredWearable[]; meta?: { available?: boolean; reason?: string } }>({ method: 'GET', path: '/v1/world/avatar/wearables' });
  }

  /** Your COSM balance (base units as a string). */
  cosmBalance() {
    return this.http.request<{ data: CosmBalance }>({ method: 'GET', path: '/v1/world/cosm/balance' });
  }

  /** The active cosmetics catalogue (read-only; buying happens on crossly.net). */
  cosmetics(params: { tier?: 'premium' | 'earned' | 'stake_exclusive'; slot?: string } = {}) {
    const query: Record<string, string> = {};
    if (params.tier) query.tier = params.tier;
    if (params.slot) query.slot = params.slot;
    return this.http.request<{ data: CosmCatalogueItem[]; meta?: { available?: boolean; decimals?: number; reason?: string } }>({ method: 'GET', path: '/v1/world/cosm/cosmetics', query });
  }

  /** Cosmetics you hold. */
  cosmInventory() {
    return this.http.request<{ data: CosmHolding[]; meta?: { available?: boolean; reason?: string } }>({ method: 'GET', path: '/v1/world/cosm/inventory' });
  }

  /**
   * The Decor Shop catalogue, grouped by surface. Read-only: buying (COSM
   * or CBX -- never card) and minting happen on crossly.net/shop/decor.
   */
  decorCatalogue(params: { surface?: DecorSurface } = {}) {
    const query: Record<string, string> = {};
    if (params.surface) query.surface = params.surface;
    return this.http.request<{ data: DecorShopItem[]; meta?: { available?: boolean; reason?: string; mint?: DecorMintAvailability; cbx?: DecorMintAvailability; balances?: { cosm: { available: boolean; baseUnits: string; decimals: number }; cbx: { available: boolean; baseUnits: string; decimals: number } } | null; surfaces?: DecorSurface[] } }>({ method: 'GET', path: '/v1/world/decor/catalogue', query });
  }

  /** Decor you hold and decor you have minted to your wallet, with mint state. */
  myDecor() {
    return this.http.request<{ data: MyDecorItem[]; meta?: { available?: boolean; reason?: string; mint?: DecorMintAvailability } }>({ method: 'GET', path: '/v1/world/decor/mine' });
  }

  /**
   * Your decor as an inventory: owned / placed / available per item and
   * where each copy is in use (home, shop rooms, stall bookings, streets).
   */
  decorInventory() {
    return this.http.request<DecorInventoryPage>({ method: 'GET', path: '/v1/world/decor/inventory' });
  }

  /** Every interactive piece (first-party and approved creator designs) a home or boutique may hold. */
  interactiveCatalogue() {
    return this.http.request<{ data: InteractiveCatalogueItem[] }>({ method: 'GET', path: '/v1/world/interactive/catalogue' });
  }

  /** Your interactive-object designs and their review state (`archived`: exclude (default), include or only archived). Read-only: authoring is on crossly.net. */
  interactiveDesigns(params: { archived?: 'exclude' | 'include' | 'only' } = {}) {
    const query: Record<string, string> = {};
    if (params.archived) query.archived = params.archived;
    return this.http.request<{ data: InteractiveDesign[] }>({ method: 'GET', path: '/v1/world/interactive/designs', query });
  }

  /** Your open trade listings a trade table can be opened on. */
  tradeTableListings() {
    return this.http.request<{ data: TradeTableListing[] }>({ method: 'GET', path: '/v1/world/trade-tables/listings' });
  }

  /** Your binder: collection items that may go on a trade mat. */
  binder() {
    return this.http.request<{ data: BinderItem[] }>({ method: 'GET', path: '/v1/world/trade-tables/binder' });
  }

  /** Your friends and the public room each is in right now (when named there). */
  friends() {
    return this.http.request<{ data: FriendHere[] }>({ method: 'GET', path: '/v1/world/friends' });
  }

  /** What your outfit is worth from the order book, and whether you show it. */
  fitValue() {
    return this.http.request<{ data: FitValue }>({ method: 'GET', path: '/v1/world/fit-value' });
  }

  /** Taps on "Shop this" / "Offer" on what you wore, last 7 days. */
  fitStats() {
    return this.http.request<{ data: FitStats }>({ method: 'GET', path: '/v1/world/fits/stats' });
  }

  /** This week's best-dressed top ten. */
  bestDressed() {
    return this.http.request<{ data: BestDressedEntry[] }>({ method: 'GET', path: '/v1/world/best-dressed' });
  }

  /** The longest current daily visit streaks, top ten. */
  streaks() {
    return this.http.request<{ data: StreakEntry[] }>({ method: 'GET', path: '/v1/world/streaks' });
  }

  /** Your saved outfits (up to 6), oldest first. */
  outfits() {
    return this.http.request<{ data: OutfitPreset[] }>({ method: 'GET', path: '/v1/world/outfits' });
  }

  /** Whether Crossly keeps a world shop for you automatically. */
  autoShop() {
    return this.http.request<{ data: AutoShopStatus }>({ method: 'GET', path: '/v1/world/auto-shop' });
  }

  // ── writes (inventory:write; none moves money) ──

  /** Wear an earned pin on your nameplate, or null for none. */
  wearPin(pin: string | null) {
    return this.http.request<{ data: { wearing: string | null } }>({ method: 'PUT', path: '/v1/world/quests/pin', body: { pin } });
  }

  /** Start a crew you own. */
  createCrew(body: { name: string; tag: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: { id: string; code: string } }>({ method: 'POST', path: '/v1/world/crews', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Join a crew by its code. */
  joinCrew(code: string) {
    return this.http.request<{ data: { joined: boolean } }>({ method: 'POST', path: '/v1/world/crews/join', body: { code } });
  }

  /** Leave your crew (the owner leaving disbands it). */
  leaveCrew() {
    return this.http.request<{ data: { left: boolean } }>({ method: 'POST', path: '/v1/world/crews/leave', body: {} });
  }

  /** Say a line to your crew; returns the ring with your line when it went out. */
  sayToCrew(text: string) {
    return this.http.request<{ data: CrewChat }>({ method: 'POST', path: '/v1/world/crew/chat', body: { text } });
  }

  /** "Join me": notify a friend of the public room you are in. */
  inviteFriend(userId: string, slug: string) {
    return this.http.request<{ data: { invited: boolean } }>({ method: 'POST', path: `/v1/world/friends/${encodeURIComponent(userId)}/invite`, body: { slug } });
  }

  /** Wear something you already own; answers your loadout after. */
  equip(body: EquipBody) {
    return this.http.request<{ data: { slot: AvatarSlot; loadout: WorldLoadout } }>({ method: 'POST', path: '/v1/world/avatar/equip', body });
  }

  /** Empty one slot (idempotent). */
  unequip(slot: AvatarSlot) {
    return this.http.request<{ data: { slot: AvatarSlot; removed: boolean; loadout: WorldLoadout } }>({ method: 'POST', path: '/v1/world/avatar/unequip', body: { slot } });
  }

  /** Turn your automatic world shop off (made private, never deleted) or back on. */
  setAutoShop(enabled: boolean) {
    return this.http.request<{ data: AutoShopStatus }>({ method: 'PATCH', path: '/v1/world/auto-shop', body: { enabled } });
  }

  /** Save what you are wearing now as a named look (appearance is your character's; 409 past 6). */
  saveOutfit(body: { name: string; appearance?: Partial<AvatarAppearance> }, opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: OutfitSaved }>({ method: 'POST', path: '/v1/world/outfits', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Rename a saved look. */
  renameOutfit(id: string, name: string) {
    return this.http.request<{ data: OutfitPreset }>({ method: 'PATCH', path: `/v1/world/outfits/${encodeURIComponent(id)}`, body: { name } });
  }

  /** Delete a saved look. */
  deleteOutfit(id: string) {
    return this.http.request<{ data: { deleted: boolean } }>({ method: 'DELETE', path: `/v1/world/outfits/${encodeURIComponent(id)}` });
  }

  /** Put a saved look on, through the equip flow: what you no longer own comes back in skipped. */
  applyOutfit(id: string) {
    return this.http.request<{ data: OutfitApplied }>({ method: 'POST', path: `/v1/world/outfits/${encodeURIComponent(id)}/apply`, body: {} });
  }
}
