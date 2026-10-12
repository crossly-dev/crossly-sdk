import type { HttpClient } from './_shared.js';

// ─── The Commons chest in Crossly World ─────────────────────────────────────
//
// Every 20 minutes (UTC) a chest stands somewhere on the Commons plaza; walking
// up to it opens it for you -- the server sees you there -- so no verb here
// opens one. Chests opened in 10 different windows earn the Chest opener
// pin; nothing here moves money. Reads need activity:read.

export interface ChestView {
  /** This 20-minute window (UTC). */
  window: number;
  /** Where this window's chest stands on the plaza, [x, z] in metres. */
  spot: [number, number];
  /** When the next chest comes, ISO. */
  endsAt: string;
  mine: {
    openedThis: boolean;
    /** Windows you have opened a chest in (the pin comes at 10). */
    opened: number;
  } | null;
}

export class WorldChestsResource {
  constructor(private http: HttpClient) {}

  /** This window's chest, and yours. */
  get() {
    return this.http.request<{ data: ChestView }>({ method: 'GET', path: '/v1/world/chests' });
  }
}
