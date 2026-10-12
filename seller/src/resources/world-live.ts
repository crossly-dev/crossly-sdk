import type { HttpClient } from './_shared.js';

// ─── Pets, the Main Stage and festivals in Crossly World ───────────────────
//
// Pets follow you around the world: a cat, a dog and a slab-carrying robot,
// each earned through a quest or a reputation level and never sold. The Main
// Stage is the world's big venue (brand launches, creator meetups, festival
// shows) with a host lineup and a lineup host's stream on its screen. A
// festival is an ops-scheduled weekend when every street wears one decor and
// the festival quest line (limited pins) counts. All read-only here.

export type PetKind = 'cat' | 'dog' | 'slab_bot';

export interface Pet {
  kind: PetKind;
  name: string;
  blurb: string;
  owned: boolean;
  earnedAt: string | null;
  howToEarn: string;
  ways: Array<{ text: string; done: boolean }>;
}

export interface MyPets {
  pets: Pet[];
  /** The pet walking beside you, or null. */
  active: PetKind | null;
  /** The pet greeting visitors at your shop door, or null. */
  shopPet: PetKind | null;
  hasShop: boolean;
}

export type StageEventKind = 'brand_launch' | 'creator_meetup' | 'festival' | 'talk' | 'live_sale';

export interface StageEvent {
  id: string;
  title: string;
  kind: StageEventKind;
  about: string | null;
  startsAt: string;
  endsAt: string;
  cancelledAt: string | null;
  lineup: Array<{ name: string; role: string; profile: string | null }>;
  festivalId: string | null;
}

export interface MainStage {
  slug: 'main-stage';
  name: string;
  /** People per copy; more copies open as it fills. */
  capacity: number;
  here: number;
  live: StageEvent | null;
  upcoming: StageEvent[];
  stream: { id: string; title: string; playbackUrl: string | null; coverImageUrl: string | null; host: string | null } | null;
}

export type FestivalDecor = 'fair' | 'valentine' | 'spring' | 'summer' | 'school' | 'halloween' | 'holiday' | 'winter';

export interface Festival {
  id: string;
  title: string;
  tagline: string | null;
  decor: FestivalDecor;
  startsAt: string;
  endsAt: string;
  cancelledAt: string | null;
}

export interface WorldItemHit { roomSlug: string; roomName: string; itemId: string; title: string; listingSlug: string; priceCents: number; imageUrl: string | null }
export interface WorldShelf { roomSlug: string; roomName: string; itemId: string }
export interface WorldCheapest { listingSlug: string; priceCents: number; roomSlug: string | null; itemId: string | null }
export interface RoomFunnel { days: number; viewers: number; looks: number; inspects: number; checkouts: number; sales: number; revenueCents: number }
export interface WorldBlock { id: string; label: string; createdAt: string }
export interface RoomWant { itemId: string; wants: number }

export class WorldLiveResource {
  constructor(private http: HttpClient) {}

  /** Your pets: every kind, owned or not, how to earn each, the active one and your shop's greeter. */
  myPets() {
    return this.http.request<MyPets>({ method: 'GET', path: '/v1/pets/mine' });
  }

  /** The Main Stage now: live show, screen, crowd, what is next. */
  mainStage() {
    return this.http.request<MainStage>({ method: 'GET', path: '/v1/main-stage' });
  }

  /** Live and upcoming Main Stage events, soonest first. */
  stageEvents() {
    return this.http.request<{ data: StageEvent[] }>({ method: 'GET', path: '/v1/main-stage/events' });
  }

  /** Live and upcoming festivals; meta.live is the one on now. */
  festivals() {
    return this.http.request<{ data: Festival[]; meta: { live: string | null } }>({ method: 'GET', path: '/v1/festivals' });
  }

  /** Find an item on a shelf anywhere in the world (q, 2+ characters). */
  searchItems(q: string) {
    return this.http.request<{ data: WorldItemHit[] }>({ method: 'GET', path: '/v1/world/items/search', query: { q } });
  }

  /** Where a listing sits on a shelf in a public room now, or null. */
  shelf(listingSlug: string) {
    return this.http.request<{ data: WorldShelf | null }>({ method: 'GET', path: `/v1/world/shelf/${encodeURIComponent(listingSlug)}` });
  }

  /** The cheapest copy of a catalogue piece for sale now, or null. */
  cheapest(skuId: string) {
    return this.http.request<{ data: WorldCheapest | null }>({ method: 'GET', path: `/v1/world/skus/${encodeURIComponent(skuId)}/cheapest` });
  }

  /** Your room's funnel: visitors, opened, checked out from the room, paid, revenue. */
  roomFunnel(sceneId: string, days?: number) {
    return this.http.request<{ data: RoomFunnel }>({ method: 'GET', path: `/v1/world/rooms/${encodeURIComponent(sceneId)}/funnel`, query: days ? { days } : undefined });
  }

  /** Items your room shows but does not sell that visitors said they would buy. */
  roomWants(sceneId: string) {
    return this.http.request<{ data: RoomWant[] }>({ method: 'GET', path: `/v1/world/rooms/${encodeURIComponent(sceneId)}/wants` });
  }

  /** The people you blocked in the world, as you saw them. */
  blocks() {
    return this.http.request<{ data: WorldBlock[] }>({ method: 'GET', path: '/v1/world/blocks' });
  }
}
