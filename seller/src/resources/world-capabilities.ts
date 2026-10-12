import type { HttpClient } from './_shared.js';

// ─── NFT capabilities in Crossly World ────────────────────────────────────
//
// What a collection's tokens can DO in the world -- wear, display, place,
// emote, theme a room, open a gate, hold a game pass -- declared once per
// collection and honoured by the web, the native app and the api. Spec:
// docs/NFT-CAPABILITIES.md (crossly.nft-capabilities/1). Reads need
// inventory:read; declaring needs world:create. Nothing here moves money.

export type NftCapabilityKind =
  | 'badge' | 'wear' | 'display' | 'place' | 'emote' | 'room_theme' | 'pet'
  | 'portal' | 'gate' | 'quest' | 'game_pass' | 'perk' | 'interactive';

export type CapabilityMatch = { all: true } | { tokenIds: string[] } | { trait: { key: string; value: string } };

export interface NftCapability {
  kind: NftCapabilityKind;
  match: CapabilityMatch;
  params: Record<string, unknown>;
}

/** A whole declaration, as PUT. `collection` must be the collection in the path. */
export interface CapabilityDeclarationInput {
  spec: 'crossly.nft-capabilities/1';
  collection: { chain: string; address: string };
  name?: string;
  capabilities: NftCapability[];
}

export interface CapabilityDeclarationView {
  id: string;
  chain: string;
  contract: string;
  declarer: 'creator' | 'community' | 'crossly';
  reviewState: 'pending' | 'live' | 'rejected';
  reviewNote: string | null;
  declaration: CapabilityDeclarationInput;
  createdAt: string;
  capabilities: Array<NftCapability & { summary: string }>;
}

export interface HeldCapabilities {
  tokens: Array<{
    chain: string; contract: string; tokenId: string; name: string | null; imageUrl: string | null; collectionName: string | null;
    capabilities: Array<NftCapability & { summary: string; declarer: 'creator' | 'community' | 'crossly' }>;
  }>;
  kinds: NftCapabilityKind[];
}

export interface CapabilityCatalogue {
  spec: string;
  kinds: Array<{ kind: NftCapabilityKind; summary: string; creatorOnly: boolean; review: 'never' | 'asset' | 'always'; clients: string[] }>;
}

/** Your NFT wear picks (slot -> refId) and what the room sees. */
export interface NftWearState { picks: Record<string, string>; worn: Array<{ model: string; slot: string; label?: string; asset?: string }> }

/** One of your COSM designs as the world sees it. */
export interface CosmDesignWorldView {
  id: string; name: string; slot: string; tier: string; active: boolean; maxSupply: number | null; mintedCount: number;
  chainAutoUnlock: boolean; previewImageUrl: string | null; onChain: boolean;
  popularity: { holders: number; issued: number; maxSupply: number | null; resales: number; inUse: number; progress: number; passed: boolean; why: string | null } | null;
}

/** The answer to an auto-unlock change: the design and its popularity now. */
export interface CosmAutoUnlockResult { cosmeticId: string; enabled: boolean; popularity: CosmDesignWorldView['popularity'] }

export class WorldCapabilitiesResource {
  constructor(private readonly http: HttpClient) {}

  /** What your held NFTs unlock, per token. */
  mine() {
    return this.http.request<{ data: HeldCapabilities }>({ method: 'GET', path: '/v1/world/capabilities' });
  }

  /** The capability kinds of the current spec: what each does, who may declare it, whether it is reviewed. */
  catalogue() {
    return this.http.request<{ data: CapabilityCatalogue }>({ method: 'GET', path: '/v1/world/capabilities/catalogue' });
  }

  /** A collection's live declaration. */
  forCollection(chain: string, contract: string) {
    return this.http.request<{ data: CapabilityDeclarationView }>({ method: 'GET', path: `/v1/world/collections/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}/capabilities` });
  }

  /** Your declarations, every review state. */
  declarations() {
    return this.http.request<{ data: CapabilityDeclarationView[] }>({ method: 'GET', path: '/v1/world/capabilities/declarations' });
  }

  /** Declare (or replace) what a collection's tokens can do. */
  declare(chain: string, contract: string, declaration: CapabilityDeclarationInput) {
    return this.http.request<{ data: CapabilityDeclarationView }>({ method: 'PUT', path: `/v1/world/collections/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}/capabilities`, body: declaration });
  }

  /** Reserve one of your listings for holders of a collection you declared a holders_only perk for (or release it). */
  setHoldersOnly(listingId: string, enabled: boolean) {
    return this.http.request<{ data: { listingId: string; holdersOnly: boolean } }>({ method: 'PUT', path: `/v1/world/listings/${encodeURIComponent(listingId)}/holders-only`, body: { enabled } });
  }

  /** What you wear from your NFTs and COSM copies: your pick per slot and what the room sees. */
  wear() {
    return this.http.request<{ data: NftWearState }>({ method: 'GET', path: '/v1/world/capabilities/wear' });
  }

  /** Wear a held token (its refId) on an avatar slot, or pass null to take it off. */
  setWear(slot: 'head' | 'body' | 'legs' | 'feet' | 'back', refId: string | null) {
    return this.http.request<{ data: NftWearState }>({ method: 'PUT', path: '/v1/world/capabilities/wear', body: { slot, refId } });
  }

  /** Your COSM designs in the world: popularity toward the free chain unlock, on-chain state, your opt-out. */
  cosmDesigns() {
    return this.http.request<{ data: CosmDesignWorldView[] }>({ method: 'GET', path: '/v1/world/cosm/designs' });
  }

  /** Opt one of your COSM designs in or out of the free chain unlock it earns when popular. */
  setCosmChainAutoUnlock(cosmeticId: string, enabled: boolean) {
    return this.http.request<{ data: CosmAutoUnlockResult }>({ method: 'PUT', path: `/v1/world/cosm/designs/${encodeURIComponent(cosmeticId)}/chain-auto-unlock`, body: { enabled } });
  }

  /** Withdraw your declaration. */
  withdraw(chain: string, contract: string) {
    return this.http.request<void>({ method: 'DELETE', path: `/v1/world/collections/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}/capabilities` });
  }
}
