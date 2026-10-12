import type { HttpClient } from './_shared.js';

// ─── Crossly World game packages ──────────────────────────────────────────
//
// Build a game as a folder (docs/WORLD-GAME-PACKAGES.md), submit it, and once
// a person reviews it, it is in the Game Directory for anyone to place. A game
// may have a store (items and passes, sold through Crossly checkout) and a
// reward table, granted only against the live, reviewed version. Reads need
// inventory:read; buying needs world:write; submitting needs world:create.

export type GameRecord = Record<string, unknown>;

/** One file of a package: its package-relative path and its bytes, base64. */
export interface GamePackageFile { path: string; base64: string }

export interface GamePackageSubmit {
  files: GamePackageFile[];
  /** What a copy of the game piece costs in COSM base units (6 decimals), as a string. Default 1 COSM. */
  piecePriceBaseUnits?: string;
  maxSupply?: number | null;
}

/** A package checked as a submission would be, nothing stored (world-kit validate). */
export interface GamePackageCheck { ok: boolean; issues: Array<{ path: string; message: string }>; fits: Record<string, boolean>; totalBytes: number; manifest: { id: string; name: string; version: string; mode: string } | null }

export interface GamePackageSubmitted {
  package: { id: string; slug: string; designId: string };
  version: { id: string; semver: string; designVersion: number; state: string };
  store: Array<{ itemId: string; kind: string; name: string; priceCents: number; cosmeticId: string }>;
  fits: Record<string, boolean>;
}

export interface GameStoreCheckout { clientSecret: string; paymentIntentId: string; priceCents: number; currency: string }

export class WorldGamesResource {
  constructor(private readonly http: HttpClient) {}

  /** The Game Directory: every live, reviewed game. */
  list() {
    return this.http.request<{ data: GameRecord[] }>({ method: 'GET', path: '/v1/world/games' });
  }

  /** One live game, its store, and which items you own. */
  get(id: string) {
    return this.http.request<{ data: GameRecord }>({ method: 'GET', path: `/v1/world/games/${encodeURIComponent(id)}` });
  }

  /** Your packages, each with its latest version and review state. */
  packages() {
    return this.http.request<{ data: GameRecord[] }>({ method: 'GET', path: '/v1/world/games/packages' });
  }

  /** One of your packages, every version. */
  package(id: string) {
    return this.http.request<{ data: GameRecord }>({ method: 'GET', path: `/v1/world/games/packages/${encodeURIComponent(id)}` });
  }

  /** Submit a package version for review. */
  /** A fresh package from a template (table, arena, object; collection = an NFT capability declaration): world-kit init. */
  template(kind: 'table' | 'arena' | 'object' | 'collection', id = 'my-game', name = 'My Game') {
    return this.http.request<{ data: { kind: string; files: GamePackageFile[] } }>({ method: 'GET', path: `/v1/world/games/templates/${encodeURIComponent(kind)}`, query: { id, name } });
  }

  /** Validate a package exactly as a submission is checked, storing nothing: world-kit validate. */
  check(files: GamePackageFile[]) {
    return this.http.request<{ data: GamePackageCheck }>({ method: 'POST', path: '/v1/world/games/packages/check', body: { files } });
  }

  submit(input: GamePackageSubmit) {
    return this.http.request<{ data: GamePackageSubmitted }>({ method: 'POST', path: '/v1/world/games/packages', body: input });
  }

  /** Buy an item or pass from a game store: answers a client secret for the payment. */
  checkout(id: string, itemId: string) {
    return this.http.request<{ data: GameStoreCheckout }>({ method: 'POST', path: `/v1/world/games/${encodeURIComponent(id)}/store/${encodeURIComponent(itemId)}/checkout`, body: {} });
  }

  /** Rewards you won in games. */
  rewards() {
    return this.http.request<{ data: GameRecord[] }>({ method: 'GET', path: '/v1/world/games/rewards' });
  }

  /** A live game leaderboard, this week and all time (scoring null: it keeps no board). */
  leaderboard(id: string) {
    return this.http.request<{ data: GameRecord }>({ method: 'GET', path: `/v1/world/games/${encodeURIComponent(id)}/leaderboard` });
  }

  /** Rate a game you played, 1 to 5 stars. */
  rate(id: string, stars: number) {
    return this.http.request<{ data: GameRecord }>({ method: 'POST', path: `/v1/world/games/${encodeURIComponent(id)}/rating`, body: { stars } });
  }

  /** Report a game to staff: broken | unfair | offensive | scam | other. */
  report(id: string, reason: 'broken' | 'unfair' | 'offensive' | 'scam' | 'other', detail?: string) {
    return this.http.request<{ data: GameRecord }>({ method: 'POST', path: `/v1/world/games/${encodeURIComponent(id)}/report`, body: { reason, detail } });
  }
}
