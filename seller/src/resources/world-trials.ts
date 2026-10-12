import type { HttpClient } from './_shared.js';

// ─── Hoverboard Time Trials in Crossly World ────────────────────────────────
//
// Ring courses raced on the hoverboard: through the start arch, every ring in
// order, back through the arch. Laps are timed by Crossly from where it saw
// you ride in the world -- on the board, rings in order, at a speed a board
// can go -- so there is no verb here that records one. Best times are kept
// per course per week (weeks start Monday, UTC); prizes are pins, never
// money. Reads need activity:read.

export interface TrialCourseInfo {
  /** e.g. "commons-loop". */
  id: string;
  name: string;
  /** Beat this (ms) for the course's par pin. */
  parMs: number;
  rings: number;
  lengthM: number;
}

export interface TrialRow {
  rank: number;
  /** Their name in the world, only when they chose to be seen by name; otherwise "A player". */
  name: string;
  /** The name as the board in the Commons draws it: ASCII, short. */
  short: string;
  named: boolean;
  /** Lap time, milliseconds. */
  ms: number;
  /** When it was set. */
  at: string;
}

export interface TrialLeaderboard {
  course: TrialCourseInfo;
  /** The week shown: its Monday, YYYY-MM-DD. */
  week: string;
  /** This week's ten fastest. */
  weekly: TrialRow[];
  /** The ten fastest ever, each person once. */
  allTime: TrialRow[];
}

export interface TrialMyCourse {
  course: TrialCourseInfo;
  /** Your best lap this week, your place on the weekly board, laps finished, and the split at each ring (ms from the start). */
  week: { ms: number; rank: number; laps: number; splits: number[] } | null;
  /** Your best ever and its place on the all-time board. */
  allTime: { ms: number; rank: number; at: string } | null;
}

export interface TrialMine {
  week: string;
  courses: TrialMyCourse[];
}

export class WorldTrialsResource {
  constructor(private http: HttpClient) {}

  /** Your bests on every course: this week and all time. */
  mine() {
    return this.http.request<{ data: TrialMine }>({ method: 'GET', path: '/v1/world/trials/mine' });
  }

  /** A course's boards: this week's fastest and the all-time fastest. Course 1 is "commons-loop". */
  leaderboard(course = 'commons-loop') {
    return this.http.request<{ data: TrialLeaderboard }>({ method: 'GET', path: `/v1/world/trials/${encodeURIComponent(course)}/leaderboard` });
  }
}
