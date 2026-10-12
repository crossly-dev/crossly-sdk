import type { HttpClient } from './_shared.js';

// ─── The Arcade in Crossly World ────────────────────────────────────────────
//
// An indoor hall of cabinets, one per game the world already has: the
// first-party pieces (Light Chase, Connect Four, Trivia Buzzers, Hoop Shot,
// the claw machine, chess), Price Guess practice, and creators' games from the
// Game Directory. Its High Score wall reads the scores those games already
// keep. Games are PLAYED in the world, at their cabinets; this is read-only
// and nothing here moves money. Needs activity:read.

export type ArcadeHost = 'piece' | 'price_guess' | 'empty';

export interface ArcadeCabinet {
  slot: number;
  /** The cabinet's spot in the hall (metres) and which way it faces (radians). */
  position: [number, number, number];
  rotationY: number;
  host: ArcadeHost;
  /** `arcade_cabinet`, `price_guess`, `connect_four`..., `c_<handle>` for a creator's game, '' when empty. */
  game: string;
  title: string;
  blurb: string;
  /** The interactive piece it hosts and where it stands; null for Price Guess and an empty cabinet. */
  piece: { model: string; position: [number, number, number]; rotationY: number } | null;
  pieceIsCabinet: boolean;
  record: 'light_chase' | 'basketball' | 'trivia' | 'claw' | null;
  /** A creator's game: its Game Directory id and thumbnail, and how its leaderboard ranks. */
  packageId: string | null;
  thumbnail: string | null;
  scoreOrder: 'asc' | 'desc' | null;
  players: string;
  accent: number;
}

export interface ArcadeScoreBoard {
  game: string;
  title: string;
  /** leaderboard: Price Guess's ranking; record: a piece's room record; top: a creator game's best scores. */
  kind: 'leaderboard' | 'record' | 'top';
  /** Up to five ASCII lines. A name shows only for somebody who chose to be seen by name; everyone else is "A player". */
  lines: string[];
}

export interface ArcadeView {
  cabinets: ArcadeCabinet[];
  scores: ArcadeScoreBoard[];
  /** Creators' games with a cabinet right now. */
  creatorGames: number;
}

export class WorldArcadeResource {
  constructor(private http: HttpClient) {}

  /** The Arcade: every cabinet (which game it hosts, where) and the High Score wall. */
  get() {
    return this.http.request<{ data: ArcadeView }>({ method: 'GET', path: '/v1/world/arcade' });
  }
}
