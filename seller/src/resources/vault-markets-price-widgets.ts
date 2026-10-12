import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Vault Markets: embeddable price widgets for creators ───────────────────
//
// `client.vaultMarkets.priceWidgets`. A widget shows one vault market's mark or one
// public Crossly index's level on your own page, through an iframe or a script
// tag, with a link back to crossly.net through your own affiliate code when
// you have an eligible one (and a disclosure whenever it does). Every number
// is read from the Crossly order book when the widget is viewed: nothing here
// stores a price, moves money or places an order. The market or index a widget
// shows is fixed when it is made; make another widget for another one.
// Reads need vault-markets:read; making, changing and deleting need
// vault-markets:trade. Money fields are integer CENTS of US dollars.

export type VaultPriceWidgetKind = 'mark' | 'index';
export type VaultPriceWidgetRange = '1m' | '3m' | '6m' | '1y' | '5y';
export type VaultPriceWidgetLayout = 'compact' | 'chart';
export type VaultPriceWidgetTheme = 'auto' | 'light' | 'dark';

export interface VaultPriceWidget {
  id: string;
  name: string;
  kind: VaultPriceWidgetKind;
  /** kind mark: `variantId:condition:gradeKey`. */
  bookKey: string | null;
  /** kind index: the index slug. */
  indexSlug: string | null;
  range: VaultPriceWidgetRange;
  layout: VaultPriceWidgetLayout;
  theme: VaultPriceWidgetTheme;
  /** The code on the widget; `linked` is false once it is paused or no longer eligible (the widget then links plainly). */
  affiliateCode: { id: string; code: string | null; linked: boolean } | null;
  /** Sites allowed to show it, as `https://host`; empty = any. */
  allowedOrigins: string[];
  frameUrl: string;
  scriptUrl: string;
  /** The same numbers as JSON `{ data }`. */
  dataUrl: string;
  /** Paste one of these into your page. */
  snippets: { iframe: string; script: string };
  frame: { width: number; height: number };
  createdAt: string | null;
  updatedAt: string | null;
}

export interface VaultPriceWidgetCode {
  id: string;
  code: string;
  label: string | null;
}

export interface VaultPriceWidgetList {
  data: VaultPriceWidget[];
  meta: {
    /** Your affiliate codes a widget can link through (active, not a seller shop code). */
    codes: VaultPriceWidgetCode[];
    /** Live widgets allowed per creator. */
    max: number;
    /** Whether you joined the Vault Markets creator programme (changes the disclosure words). */
    inCreatorProgramme: boolean;
  };
}

export interface VaultPriceWidgetView {
  id: string | null;
  kind: VaultPriceWidgetKind;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  /** Cents (a market) or the level (an index); null when it rests on too little to show. */
  value: number | null;
  valueText: string;
  /** The move over the range, first to last point. */
  changeBps: number | null;
  changeText: string | null;
  points: number[];
  quality: 'A' | 'B' | 'C' | 'none';
  n: number;
  nText: string;
  asOf: string | null;
  insufficient: boolean;
  /** The link back, through your affiliate link when it applies. */
  href: string;
  /** "Prices from the Crossly order book". */
  source: string;
  disclosure: string | null;
  range: VaultPriceWidgetRange;
  layout: VaultPriceWidgetLayout;
  theme: VaultPriceWidgetTheme;
}

export interface VaultPriceWidgetPreview {
  view: VaultPriceWidgetView;
  /** The exact page the iframe would serve. */
  html: string;
  frame: { width: number; height: number };
}

export interface VaultPriceWidgetArchived {
  id: string;
  archived: true;
}

export interface CreateVaultPriceWidgetBody {
  kind: VaultPriceWidgetKind;
  /** Required for kind mark. */
  bookKey?: string;
  /** Required for kind index. */
  indexSlug?: string;
  /** Your own label; defaults to the market or index name. */
  name?: string;
  range?: VaultPriceWidgetRange;
  layout?: VaultPriceWidgetLayout;
  theme?: VaultPriceWidgetTheme;
  /** One of your own active, unscoped affiliate codes; null for none. */
  affiliateCodeId?: string | null;
  /** Sites allowed to show it, e.g. ["https://blog.example.com"]; empty = any. */
  allowedOrigins?: string[];
}

export type PreviewVaultPriceWidgetBody = Omit<CreateVaultPriceWidgetBody, 'allowedOrigins'>;

export interface UpdateVaultPriceWidgetBody {
  name?: string;
  range?: VaultPriceWidgetRange;
  layout?: VaultPriceWidgetLayout;
  theme?: VaultPriceWidgetTheme;
  affiliateCodeId?: string | null;
  allowedOrigins?: string[];
}

export class VaultMarketsPriceWidgetsResource {
  constructor(private http: HttpClient) {}

  /** Your widgets, newest first, with snippets; `meta.codes` are the codes you can link through. */
  list() {
    return this.http.request<VaultPriceWidgetList>({ method: 'GET', path: '/v1/vault-markets/price-widgets' });
  }

  /** Make a widget for one market (`bookKey`) or one public index (`indexSlug`). */
  create(body: CreateVaultPriceWidgetBody, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultPriceWidget>({ method: 'POST', path: '/v1/vault-markets/price-widgets', body, idempotencyKey: opts.idempotencyKey });
  }

  /** What a widget would show, and its exact frame HTML, without saving it. */
  preview(body: PreviewVaultPriceWidgetBody) {
    return this.http.request<VaultPriceWidgetPreview>({ method: 'POST', path: '/v1/vault-markets/price-widgets/preview', body });
  }

  /** One of your widgets. */
  get(id: string) {
    return this.http.request<VaultPriceWidget>({ method: 'GET', path: `/v1/vault-markets/price-widgets/${encodeURIComponent(id)}` });
  }

  /** Change the look, the name, the code or the allowed sites (never the market or index). */
  update(id: string, body: UpdateVaultPriceWidgetBody, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultPriceWidget>({ method: 'PATCH', path: `/v1/vault-markets/price-widgets/${encodeURIComponent(id)}`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Delete a widget; pages that still paste it say it is no longer available. */
  delete(id: string) {
    return this.http.request<VaultPriceWidgetArchived>({ method: 'DELETE', path: `/v1/vault-markets/price-widgets/${encodeURIComponent(id)}` });
  }
}
