// ── Live Shop ────────────────────────────────────────────────────────
//
// Scan, lock-on, HUD and "cheapest anywhere" shapes for `BuyerResource`.
//
// Re-exported from `../buyer.js`, which stays the public import path —
// nothing outside this directory should reach in here.

export type ScanTier = 'identifier' | 'visual' | 'vision' | 'none';

/**
 * A product we think it might be, offered for a human to confirm.
 *
 * Used by both the single-shot scan and the lock-on loop, deliberately: a
 * buyer saying "yes, that is it" is one interaction, and two shapes for it is
 * how the confirm path ends up handled twice and fixed once.
 */
export interface LockonCandidate {
  identifierNs: string;
  identifierValue: string;
  title: string;
  imageUrl: string | null;
  priceCents: number | null;
  storeName: string | null;
}

export interface HudFact {
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'neutral';
}

export interface HudAction {
  kind: 'buy_crossly' | 'buy_offsite' | 'confirm' | 'save' | 'none';
  label: string;
  /** Null for `save` and `confirm`, which navigate nowhere. */
  url: string | null;
}

/**
 * Pre-formatted for a 600x600 lens. Render it verbatim.
 *
 * Reformatting on the client is how the caveat that makes a price claim true —
 * "Before postage" above all — gets dropped to make a line fit.
 */
/**
 * A discount code to try at the recommended retailer.
 *
 * `measured` is the field that matters: false means the code is real but has
 * never been observed to work, so `savingLabel` says "code available" rather
 * than quoting a figure. Do not compose your own saving text — an unmeasured
 * code has no number, and inventing one is what turns a helpful overlay into
 * one nobody believes.
 */
export interface HudCoupon {
  code: string;
  savingLabel: string;
  measured: boolean;
}

export interface Hud {
  headline: string;
  subline: string | null;
  facts: HudFact[];
  action: HudAction;
  tone: 'win' | 'info' | 'none';
  imageUrl: string | null;
  /**
   * The product a `confirm` action is asking about. Null otherwise.
   *
   * Send its IDENTIFIER back through `scan()` to get a priced verdict — a
   * title would only go through text search and land on a different product
   * with a similar name.
   */
  confirm?: LockonCandidate | null;
  /** A code to try at the retailer. Null for a Crossly recommendation. */
  coupon?: HudCoupon | null;
}

export interface ScanResult {
  tier: ScanTier;
  confidence: number;
  identifier: { ns: string; value: string } | null;
  /** Words a vision model read. NEVER an identity — see the API docs. */
  visionLabel: string | null;
  /** True when the paid rung was skipped for the day, not that it found nothing. */
  visionQuotaExhausted: boolean;
  verdict: 'crossly_best' | 'offsite_cheaper' | 'offsite_only' | 'crossly_only' | 'no_match';
  savingCents: number | null;
  shippingUnknown: boolean;
  /**
   * Retailer products whose PHOTO matched the one you sent, for an item
   * carrying no barcode and no readable tag.
   *
   * Guesses, ranked. Nothing here is an identity: confirm one (`hud.confirm`
   * is the one being offered) and call `scan()` again with its identifier to
   * get a verdict that is actually about the item in front of you.
   */
  candidates: LockonCandidate[];
  /**
   * The raw coupon behind `hud.coupon`, when the recommendation is a retailer.
   * Cashback is on `offsite.buyerCashbackCents`.
   */
  coupon?: OfferCoupon | null;
  hud: Hud;
}

export interface ScanSession {
  id: string;
  device: string;
  label: string | null;
  startedAt: string;
  endedAt?: string | null;
  captureCount: number;
}

export interface LockonState {
  lockonId: string;
  status: string;
  identifier: { ns: string; value: string } | null;
  /** `confirmed` means a human picked it — the strongest evidence there is. */
  identitySource: 'visual' | 'ocr' | 'barcode' | 'confirmed' | null;
  candidates: LockonCandidate[];
  observationCount: number;
  visionCalls: number;
  verdict: string;
  savingCents: number | null;
  /** A code to try at the retailer. Null for a Crossly recommendation. */
  coupon?: OfferCoupon | null;
  hud: Hud;
}

/**
 * The raw coupon behind `hud.coupon`.
 *
 * `estimatedSavingCents` is null when the code has never been observed to
 * work. Do NOT substitute a guess — `hud.coupon.savingLabel` already says
 * "code available" for exactly this case, and a number you invent is one the
 * buyer discovers at the checkout.
 */
export interface OfferCoupon {
  code: string;
  title: string | null;
  estimatedSavingCents: number | null;
  minSpendCents: number | null;
  recentSuccesses: number;
  recentAttempts: number;
}

/** Verdict payload from `anywhere`. Mirrors the HUD-less shape of a scan. */
export interface AnywhereResult {
  verdict: 'crossly_best' | 'offsite_cheaper' | 'offsite_only' | 'no_match';
  recommended: 'crossly' | 'offsite' | null;
  savingCents: number | null;
  shippingUnknown: boolean;
  crossly: Record<string, unknown> | null;
  offsite: Record<string, unknown> | null;
  alternates: Record<string, unknown>[];
  /**
   * A code to try at the recommended retailer. Cashback is separate and lives
   * on `offsite.buyerCashbackCents` — one is money off, the other money back,
   * and they stack.
   */
  coupon?: OfferCoupon | null;
}

/** A trip plus every capture it recorded, as the verdicts were given. */
export interface ScanSessionDetail extends ScanSession {
  live: boolean;
  savedCents: number;
  captures: {
    id: string;
    matchMethod: string;
    identifier: { ns: string; value: string } | null;
    verdict: string;
    displayLine: string | null;
    savingCents: number | null;
    createdAt: string;
  }[];
}
