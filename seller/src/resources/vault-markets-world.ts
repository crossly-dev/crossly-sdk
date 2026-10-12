import type { HttpClient } from './_shared.js';

// ─── Vault Markets in the world + the creator programme ────────────────────
//
// `client.vaultMarkets.world`. Market Open events in the Crossly World
// Commons, the Vault Holders' Lounge (look in freely; only holders are seen
// there), verified creators' vault shelf rooms, and the creator programme: a
// creator code earns a capped share of the fee Crossly keeps on trades by
// people new to Vault Markets who joined through it, paid by Crossly out of
// its own fee and only above its 2% net floor. Money fields are integer CENTS
// of US dollars.

export type MarketOpenEventPhase = 'scheduled' | 'soon' | 'live';

export interface MarketOpenEventShow {
  id: string;
  status: string;
  scheduledAt: string | null;
  href: string;
}

export interface MarketOpenEvent {
  slug: string;
  title: string;
  bookKey: string;
  phase: MarketOpenEventPhase;
  opensAt: string | null;
  liveAt: string | null;
  /** The world board line (ASCII). */
  line: string;
  imageUrl: string | null;
  unitsOnShelf: number;
  dealersQuoting: number;
  show: MarketOpenEventShow | null;
  openingHref: string;
  marketHref: string;
  /** A verified creator co-hosting the launch show, or null. */
  cohost: MarketOpenCohost | null;
}

export interface MarketOpenCohostCreator {
  handle: string | null;
  displayName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
}

export interface MarketOpenCohost {
  creator: MarketOpenCohostCreator;
  /** "Co-hosted by <creator>" (ASCII). */
  line: string;
  roomTitle: string;
  roomPresenceSlug: string;
  roomWorldHref: string;
  /** Set when the creator is in the creator programme: they may earn a share of the fee Crossly keeps. */
  disclosure: string | null;
}

export interface MarketOpenEventList {
  data: MarketOpenEvent[];
}

export interface VaultLoungeView {
  slug: string;
  name: string;
  tagline: string;
  requirement: string;
  minValueCents: number;
  minUnits: number;
  worldHref: string;
  signedIn: boolean;
  allowed: boolean;
  by: 'value' | 'units' | null;
  text: string;
  /** What you hold toward it: units, and their value at reliable marks only. */
  you: { units: number; reliableValueCents: number } | null;
  note: string;
}

export interface CreatorRoomCard {
  slug: string;
  presenceSlug: string;
  title: string;
  blurb: string | null;
  creator: { handle: string | null; displayName: string; avatarUrl: string | null; profileUrl: string | null };
  worldHref: string;
  disclosure: string;
}

export interface CreatorRoomList {
  data: CreatorRoomCard[];
}

export interface CreatorProgramme {
  shareBps: number;
  perTradeCapCents: number;
  lifetimeCapCents: number;
  attributionDays: number;
  floorBps: number;
  termsVersion: string;
  newTradersOnly: boolean;
  paidAs: 'crossly_bucks';
  terms: string;
  shareLabel: string;
  note: string;
}

export interface CreatorAttribution {
  creator: string;
  source: 'link' | 'code';
  startedAt: string;
  expiresAt: string;
  live: boolean;
  disclosure: string;
}

export interface MyCreatorAttribution {
  attribution: CreatorAttribution | null;
}

export interface CreatorCodeStats {
  id: string;
  code: string;
  label: string | null;
  active: boolean;
  vaultEligible: boolean;
  tradersAttributed: number;
  tradersEarning: number;
  shareLink: string;
}

export interface CreatorDashboard {
  joined: boolean;
  joinedAt: string | null;
  acceptedVersion: string | null;
  programme: CreatorProgramme;
  codes: CreatorCodeStats[];
  earnings: { accruedCents: number; paidCents: number; voidCents: number; fills: number };
  recent: Array<{ cents: number; status: string; at: string; paidAt: string | null }>;
}

export type CreatorRoomStatus = 'applied' | 'verified' | 'rejected' | 'paused';

export interface CreatorRoomView {
  id: string;
  slug: string;
  presenceSlug: string;
  title: string;
  blurb: string | null;
  status: CreatorRoomStatus;
  note: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  worldHref: string;
}

export interface MyCreatorRoom {
  room: CreatorRoomView | null;
  profilePublic: boolean;
  handle: string | null;
}

// ─── Round 7: vault-holder doors and co-hosted Market Open shows ──────────

export type PlaceVaultGateScopeKind = 'product' | 'bullion' | 'category';

export interface PlaceVaultGateScope {
  kind: PlaceVaultGateScopeKind;
  /** product: the catalogue product id; bullion: the family slug; category: the category slug. */
  ref: string;
  label?: string | null;
}

/** What you send to set a door (null opens the place again). */
export interface PlaceVaultGateInput {
  /** Cents of US dollars held at reliable (A/B) marks; 100 to 100,000,000. */
  minValueCents?: number | null;
  /** Units held in the vault; 1 to 10,000. */
  minUnits?: number | null;
  /** 'any': either threshold opens the door; 'all': both are needed. */
  mode?: 'any' | 'all';
  scope?: PlaceVaultGateScope | null;
}

export interface PlaceVaultGateRule {
  minValueCents: number | null;
  minUnits: number | null;
  mode: 'any' | 'all';
  scope: PlaceVaultGateScope | null;
}

export interface PlaceVaultGateResult {
  gate: PlaceVaultGateRule | null;
}

export interface PlaceVaultGateDetail extends PlaceVaultGateRule {
  kind: 'room' | 'space';
  requirement: string;
  scopeText: string | null;
}

export interface PlaceVaultGateView {
  place: string;
  gate: PlaceVaultGateDetail | null;
  owner: boolean;
  signedIn: boolean;
  allowed: boolean;
  by: 'value' | 'units' | 'both' | null;
  text: string;
  /** What you hold toward it, inside its scope: units, and their value at reliable marks only. */
  you: { units: number; reliableValueCents: number } | null;
  note: string | null;
}

export interface CohostedShow extends MarketOpenCohost {
  keySlug: string;
  title: string;
  phase: MarketOpenEventPhase;
  opensAt: string | null;
  liveAt: string | null;
  show: { id: string; status: string; href: string } | null;
  openingHref: string;
}

export interface CohostedShowList {
  data: CohostedShow[];
}

export type CohostInviteStatus = 'invited' | 'accepted' | 'declined' | 'withdrawn';

export interface CohostInviteKey {
  id: string;
  slug: string;
  title: string;
  status: string;
  bookKey: string;
  opensAt: string | null;
  liveStreamId: string | null;
  openingHref: string;
  showHref: string | null;
}

export interface CohostInvite {
  id: string;
  keyId: string;
  roomId: string;
  status: CohostInviteStatus;
  note: string | null;
  invitedAt: string;
  respondedAt: string | null;
  /** You are on the key's live show as a co-host. */
  onShow: boolean;
  key: CohostInviteKey;
  guidance: string;
}

export interface CohostInviteList {
  data: CohostInvite[];
}

export interface CohostResponse {
  id: string;
  keyId: string;
  roomId: string;
  status: CohostInviteStatus;
  note: string | null;
  invitedAt: string;
  respondedAt: string | null;
  onShow: boolean;
}

export class VaultMarketsWorldResource {
  constructor(private http: HttpClient) {}

  /** Market Open events in the Commons: live first, then soonest. */
  marketOpenEvents() {
    return this.http.request<MarketOpenEventList>({ method: 'GET', path: '/v1/vault-markets/world/market-open' });
  }

  /** The Vault Holders' Lounge rule and whether you may join it now. */
  lounge() {
    return this.http.request<VaultLoungeView>({ method: 'GET', path: '/v1/vault-markets/world/lounge' });
  }

  /** Verified creators' vault shelf rooms. */
  creatorRooms() {
    return this.http.request<CreatorRoomList>({ method: 'GET', path: '/v1/vault-markets/world/creator-rooms' });
  }

  /** The creator programme: the share, the caps, the window, the floor and the disclosure words. */
  creatorProgramme() {
    return this.http.request<CreatorProgramme>({ method: 'GET', path: '/v1/vault-markets/creators/programme' });
  }

  /** The creator who brought you to Vault Markets, with the disclosure. */
  myCreator() {
    return this.http.request<MyCreatorAttribution>({ method: 'GET', path: '/v1/vault-markets/creators/attribution' });
  }

  /** Use a creator code (new to Vault Markets only, once, never your own). */
  useCreatorCode(code: string) {
    return this.http.request<MyCreatorAttribution>({ method: 'POST', path: '/v1/vault-markets/creators/attribution', body: { code } });
  }

  /** For creators: your codes, traders attributed (counts only) and shares earned. */
  creatorDashboard() {
    return this.http.request<CreatorDashboard>({ method: 'GET', path: '/v1/vault-markets/creators/dashboard' });
  }

  /** For creators: your vault shelf room and what it needs. */
  myCreatorRoom() {
    return this.http.request<MyCreatorRoom>({ method: 'GET', path: '/v1/vault-markets/creators/room' });
  }
  /** The vault-holder door on a room or Space (by presence slug), and whether you may join it now. */
  placeVaultGate(place: string) {
    return this.http.request<PlaceVaultGateView>({ method: 'GET', path: `/v1/vault-markets/world/places/${encodeURIComponent(place)}/vault-gate` });
  }

  /** Set (or clear with null) the vault-holder door on your own room. */
  setRoomVaultGate(roomId: string, gate: PlaceVaultGateInput | null) {
    return this.http.request<PlaceVaultGateResult>({ method: 'PUT', path: `/v1/vault-markets/world/rooms/${encodeURIComponent(roomId)}/vault-gate`, body: gate });
  }

  /** Set (or clear with null) the vault-holder door on a Space you host. */
  setSpaceVaultGate(slug: string, gate: PlaceVaultGateInput | null) {
    return this.http.request<PlaceVaultGateResult>({ method: 'PUT', path: `/v1/vault-markets/world/spaces/${encodeURIComponent(slug)}/vault-gate`, body: gate });
  }

  /** Market Open launch shows a verified creator co-hosts, on now or opening soon. */
  cohostedShows() {
    return this.http.request<CohostedShowList>({ method: 'GET', path: '/v1/vault-markets/world/cohosts' });
  }

  /** For creators: your invites to co-host a Market Open launch show. */
  myCohostInvites() {
    return this.http.request<CohostInviteList>({ method: 'GET', path: '/v1/vault-markets/creators/cohost-invites' });
  }

  /** For creators: accept or decline an invite to co-host a Market Open launch show. */
  respondCohostInvite(inviteId: string, accept: boolean) {
    return this.http.request<CohostResponse>({ method: 'POST', path: `/v1/vault-markets/creators/cohost-invites/${encodeURIComponent(inviteId)}/respond`, body: { accept } });
  }
}
