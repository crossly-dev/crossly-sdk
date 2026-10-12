import type { HttpClient } from './_shared.js';

// ─── The Crossly World creator API (scope world:create) ───────────────────
//
// Build interactive objects (MML documents in a sandbox) and decor designs
// from your own tools: draft, check, preview, upload assets, submit for ops
// review, archive. A price is an ASK in COSM base units that an operator
// reviews; nothing here spends, mints or moves money. Guide:
// docs/WORLD-CREATORS.md.

/** A creator read or write result, as the api returns it. */
export type CreatorRecord = Record<string, unknown>;

/** A new interactive design. priceBaseUnits is COSM base units (six decimals) as a string. */
export interface InteractiveDesignInput {
  name: string;
  footprint: 's' | 'm' | 'l' | 'f';
  tint?: string;
  description?: string;
  priceBaseUnits: string;
  maxSupply?: number | null;
  source?: string;
}

/** A new decor design. priceBaseUnits is COSM base units (six decimals) as a string. */
export interface DecorDesignInput {
  unlocksKey: string;
  slug: string;
  name: string;
  meshProfile: string;
  meshParams?: Record<string, string | number | boolean | null>;
  description?: string;
  previewImageUrl?: string;
  priceBaseUnits: string;
  maxSupply?: number | null;
}

/** A new wearable. priceBaseUnits is COSM base units (six decimals) as a string. */
export interface WearableDesignInput {
  slug: string;
  name: string;
  slot: 'avatar_head' | 'avatar_body' | 'avatar_outer' | 'avatar_legs' | 'avatar_feet' | 'avatar_back';
  meshProfile: string;
  meshParams?: Record<string, unknown>;
  description?: string;
  previewImageUrl?: string;
  priceBaseUnits: string;
  maxSupply?: number | null;
}

export class WorldCreatorResource {
  constructor(private readonly http: HttpClient) {}

  /** One of your interactive designs, with its draft, last check and versions. */
  interactiveDesign(id: string) {
    return this.http.request<{ data: CreatorRecord }>({ method: 'GET', path: `/v1/world/interactive/designs/${encodeURIComponent(id)}` });
  }

  /** Create an interactive design (inactive until a submitted version is approved). */
  createInteractiveDesign(input: InteractiveDesignInput) {
    return this.http.request<{ data: CreatorRecord }>({ method: 'POST', path: '/v1/world/interactive/designs', body: input });
  }

  /** Save the draft MML source; the response carries its static check. */
  saveInteractiveDraft(id: string, source: string) {
    return this.http.request<{ data: CreatorRecord }>({ method: 'PUT', path: `/v1/world/interactive/designs/${encodeURIComponent(id)}/draft`, body: { source } });
  }

  /** Static rules, uploads and a sandboxed dry run of the draft. */
  checkInteractiveDesign(id: string) {
    return this.http.request<{ data: CreatorRecord }>({ method: 'POST', path: `/v1/world/interactive/designs/${encodeURIComponent(id)}/check`, body: {} });
  }

  /** A private preview token for the draft and the socket that runs it. */
  previewInteractiveDesign(id: string) {
    return this.http.request<{ data: CreatorRecord }>({ method: 'POST', path: `/v1/world/interactive/designs/${encodeURIComponent(id)}/preview`, body: {} });
  }

  /** Freeze the draft as a version and send it to ops review. */
  submitInteractiveDesign(id: string) {
    return this.http.request<{ data: CreatorRecord }>({ method: 'POST', path: `/v1/world/interactive/designs/${encodeURIComponent(id)}/submit`, body: {} });
  }

  /** Delete a draft, or archive a submitted design (owned copies keep working). */
  removeInteractiveDesign(id: string) {
    return this.http.request<{ data: CreatorRecord }>({ method: 'DELETE', path: `/v1/world/interactive/designs/${encodeURIComponent(id)}` });
  }

  /** Upload a glb, wav or png for your designs, as base64. */
  uploadInteractiveAsset(kind: 'glb' | 'wav' | 'png', dataBase64: string) {
    return this.http.request<{ data: CreatorRecord }>({ method: 'POST', path: '/v1/world/interactive/assets', body: { kind, dataBase64 } });
  }

  /** Wipe the state of an interactive piece in a place you own (world:write). */
  resetInteractivePiece(instanceId: string) {
    return this.http.request<{ data: CreatorRecord }>({ method: 'POST', path: '/v1/world/interactive/reset', body: { instanceId } });
  }

  /** Your decor designs and their review state. */
  decorDesigns() {
    return this.http.request<{ data: CreatorRecord[] }>({ method: 'GET', path: '/v1/world/decor/designs' });
  }

  /** Author a decor design (inactive until approved). */
  createDecorDesign(input: DecorDesignInput) {
    return this.http.request<{ data: CreatorRecord }>({ method: 'POST', path: '/v1/world/decor/designs', body: input });
  }

  /** Author a wearable for a body slot (inactive until approved). */
  createWearable(input: WearableDesignInput) {
    return this.http.request<{ data: CreatorRecord }>({ method: 'POST', path: '/v1/world/avatar/wearables', body: input });
  }

  /** Send a decor design to review. */
  submitDecorDesign(id: string) {
    return this.http.request<{ data: CreatorRecord }>({ method: 'POST', path: `/v1/world/decor/designs/${encodeURIComponent(id)}/submit`, body: {} });
  }
}
