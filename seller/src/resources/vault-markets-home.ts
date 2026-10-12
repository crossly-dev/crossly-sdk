import type { HttpClient } from './_shared.js';

// ─── Your vault in AR and in your world home ────────────────────────────────
//
// `client.vaultMarkets.home`. "Show my vault" stands the vault units you
// choose in display cases in your Crossly World home; for each you decide
// whether visitors see it (default: only you). The server places them and
// re-checks every read, so a unit you sell leaves its case on its own.
// "See it in your room" reads a unit as an AR model (the web's /ar/vault-<id>
// page). Display only: nothing moves a unit or any money, and no price
// appears. Reads need vault-markets:read, the save world:write.

export interface VaultHomeUnit {
  vaultItemId: string;
  title: string;
  grade: string | null;
  imageUrl: string | null;
  /** The unit's market (a book key), or null for an uncatalogued variant. */
  bookKey: string | null;
  /** It stands in your home now. */
  inHome: boolean;
  /** Visitors to your home see it. */
  visitors: boolean;
}

export interface VaultHomeDesk {
  home: { slug: string; privacy: 'open' | 'friends' | 'locked'; path: string };
  max: number;
  shown: number;
  visitorsSee: number;
  note: string;
  units: VaultHomeUnit[];
}

export interface VaultHomeShowUnit {
  vaultItemId: string;
  /** Visitors to your home see it (default false: only you). */
  visitors?: boolean;
}

export interface VaultHomeShowInput {
  units: VaultHomeShowUnit[];
}

export interface VaultHomeRefusal {
  vaultItemId: string;
  reason: string;
}

export interface VaultHomeShowResult {
  placed: string[];
  /** Asked for, but the home has no free case: take something out or add a case. */
  unplaced: string[];
  refused: VaultHomeRefusal[];
  desk: VaultHomeDesk;
}

export interface VaultUnitArModel {
  title: string;
  /** Path under /models, without .glb (real size, metres), or null. */
  model: string | null;
  /** The unit's own captured mesh, when it has one: drawn instead of `model`. */
  scanUrl: string | null;
  imageUrl: string | null;
  tint: string[];
  art: string[];
  scale: [number, number, number] | null;
  bookKey: string | null;
  backPath: string;
  mine: boolean;
}

export class VaultMarketsHomeResource {
  constructor(private http: HttpClient) {}

  /** Your vault units, which stand in your home, and which visitors see. */
  units() {
    return this.http.request<VaultHomeDesk>({ method: 'GET', path: '/v1/vault-markets/home/units' });
  }

  /** Show exactly these units in your home (world:write). */
  show(body: VaultHomeShowInput) {
    return this.http.request<VaultHomeShowResult>({ method: 'PUT', path: '/v1/vault-markets/home/units', body });
  }

  /** A vault unit as an AR model ("See it in your room"). */
  ar(id: string) {
    return this.http.request<VaultUnitArModel>({ method: 'GET', path: `/v1/vault-markets/units/${encodeURIComponent(id)}/ar` });
  }
}
