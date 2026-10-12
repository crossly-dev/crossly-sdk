import type { HttpClient } from './_shared.js';

// ─── Homes in Crossly World ────────────────────────────────────────────────
//
// Every account has one home: a loft filled with what it owns (inventory,
// portfolio holdings, graded slabs, furniture bought on Crossly once
// delivered). Ownership is re-checked on every read, so a sold item is simply
// gone from its display. Privacy is open (anyone), friends (mutual follows)
// or locked (the owner). Build mode lives in the world; here you can read
// homes and choose your co-builders (friends who may rearrange yours).

type V3 = [number, number, number];

export type HomePrivacy = 'open' | 'friends' | 'locked';
export type HomeTheme = 'studio' | 'daylight' | 'storybook' | 'noir' | 'vitrine';
/** `vault`: a Vault Markets unit stood in a case by "Show my vault" (client.vaultMarkets.home). */
export interface HomeRef { kind: 'inventory' | 'portfolio' | 'purchase' | 'nft' | 'token' | 'portal' | 'vault'; id: string }

export interface HomeItem {
  title: string;
  imageUrl: string | null;
  grade: string | null;
  /** Its live Crossly listing when the owner has it up (make an offer at /shop/<slug>?offer=1). */
  listingSlug: string | null;
  /** A delivered purchase: the furniture mesh it stands as. */
  model?: string;
  /** A `vault` unit: its market (a book key). */
  market?: string;
  /** A `vault` unit, to the home's owner only: visitors see it. */
  visitors?: boolean;
}

export interface HomePieceView {
  kind: 'prop' | 'display';
  /** A prop key (sofa, rug, record_player, trophy_shelf, bed, lamp, furn_*, ...) or a display (wall_frame, display_case, mannequin, shelf). */
  model: string;
  ref?: HomeRef;
  position: V3;
  rotationY: number;
  slot?: number;
  item?: HomeItem;
}

export interface HomeGuestbookEntry { id: string; author: { name: string }; body: string; createdAt: string; mine: boolean; hidden?: boolean }

export interface Home {
  slug: string;
  presenceSlug: string;
  owner: { userId: string; name: string };
  privacy: HomePrivacy;
  theme: HomeTheme;
  isOwner: boolean;
  room: { floor: { minX: number; maxX: number; minZ: number; maxZ: number }; ceiling: number; spawn: V3; target: V3; doorClear: number };
  layout: HomePieceView[];
  guestbook: HomeGuestbookEntry[];
  here: number;
  updatedAt: string;
}

export interface HomeOfTheWeek { slug: string; ownerName: string; visitors: number; here: number }

/** A friend you let rearrange your home (`friends` false once the friendship ended: listed but powerless). */
export interface HomeBuilder { userId: string; name: string; friends: boolean }
export interface HomeBuildersResult { builders: HomeBuilder[] }

export class HomesResource {
  constructor(private http: HttpClient) {}

  /** Your home (made on first read). */
  mine() {
    return this.http.request<Home>({ method: 'GET', path: '/v1/homes/mine' });
  }

  /** A home by its address, as you may see it (404 when you may not enter). */
  get(slug: string) {
    return this.http.request<Home>({ method: 'GET', path: `/v1/homes/${encodeURIComponent(slug)}` });
  }

  /** Your co-builders: friends who may rearrange your home in the world (never adding your bought pieces). */
  builders() {
    return this.http.request<{ data: HomeBuilder[] }>({ method: 'GET', path: '/v1/homes/mine/builders' });
  }

  /** Replace your co-builders: friends only, at most 4 ([] clears them). Needs world:write. */
  setBuilders(userIds: string[]) {
    return this.http.request<{ data: HomeBuildersResult }>({ method: 'PUT', path: '/v1/world/home/builders', body: { userIds } });
  }

  /** Open homes with the most different guestbook signers in the last 7 days. */
  ofTheWeek() {
    return this.http.request<{ data: HomeOfTheWeek[] }>({ method: 'GET', path: '/v1/homes/of-the-week' });
  }
}
