import type { HttpClient } from './_shared.js';

// ─── Vault Markets paper-trading missions ──────────────────────────────────
//
// `client.vaultMarkets.paper.missions`. Guided missions in Vault Learn, built
// on paper trading (PLAY MONEY ONLY: never real, never convertible). Progress
// is observed by the server from your paper orders and fills, the shopping
// agent's price watches, your set goals and graded mark checks; there is no
// call that marks a mission done. Missions earn world quest progress and
// cosmetic pins (Paper trainee, Paper graduate), never money or CBX.

export type PaperMissionKey = 'first_fill' | 'read_mark' | 'bid_below' | 'maker_fill' | 'instant_exit' | 'price_watch' | 'round_trip' | 'mini_set';
export type PaperMissionAction = 'market' | 'paper' | 'mark_check' | 'assistant' | 'sets';
export type MarkQualityLetter = 'A' | 'B' | 'C';

export interface PaperMission {
  key: PaperMissionKey;
  /** 1-based position in the suggested order. */
  order: number;
  title: string;
  goal: string;
  how: string;
  target: number;
  count: number;
  done: boolean;
  doneAt: string | null;
  /** Where to do it: a market page, the paper account, the mark check, the shopping assistant or set goals. */
  action: PaperMissionAction;
  /** The Vault Learn lesson it builds on, if any. */
  learn: 'marks' | 'instant-exit' | null;
}

export interface MarkCheckMarket {
  bookKey: string;
  name: string | null;
  label: string | null;
  imageUrl: string | null;
}

export interface MarkCheckState {
  /** A market to read next (null when today's checks are used up or none is left). */
  suggestion: MarkCheckMarket | null;
  answeredToday: number;
  perDay: number;
  letters: MarkQualityLetter[];
}

export interface PaperMissionsMeta {
  total: number;
  done: number;
  pins: { first: string; all: string };
  /** Null once "Read the mark" is done. */
  markCheck: MarkCheckState | null;
  playMoney: true;
  label: string;
}

export interface PaperMissionList {
  data: PaperMission[];
  meta: PaperMissionsMeta;
}

export interface MarkCheckInput {
  bookKey: string;
  quality: MarkQualityLetter;
}

export interface MarkCheckResult {
  bookKey: string;
  answer: MarkQualityLetter;
  correct: boolean;
  /** The stored mark's quality letter, told after the one answer a market allows. */
  quality: MarkQualityLetter;
  mission: { count: number; target: number; done: boolean };
  next: MarkCheckMarket | null;
}

export class VaultMarketsMissionsResource {
  constructor(private http: HttpClient) {}

  /** Every paper-trading mission with your progress, and a market to read for "Read the mark". */
  list() {
    return this.http.request<PaperMissionList>({ method: 'GET', path: '/v1/vault-markets/paper/missions' });
  }

  /** Answer "Read the mark": the quality letter you read on a market page (one answer per market, 10 a day). */
  answerMarkCheck(input: MarkCheckInput) {
    return this.http.request<MarkCheckResult>({ method: 'POST', path: '/v1/vault-markets/paper/missions/mark-check', body: input });
  }
}
