/**
 * Customer payload types. Mirror @crosslister/shared's BuyerProfile /
 * CustomerStats (the SDK is published standalone, so it carries its own copy).
 * Every stat is nullable: null means the marketplace did not share it.
 */

export type BuyerProfileSource = 'order' | 'profile_fetch' | 'crossly';
export type BuyerProfileFetchStatus = 'ok' | 'unsupported' | 'not_found' | 'error';

/** What one marketplace tells a seller about a buyer. */
export interface BuyerProfile {
  platform: string;
  handle: string;
  platformUserId: string | null;
  displayName: string | null;
  /** Crossly CDN url (avatars are rehosted, never hotlinked). */
  avatarUrl: string | null;
  profileUrl: string | null;
  /** 0–5, only where the marketplace has star ratings. */
  rating: number | null;
  ratingCount: number | null;
  feedbackScore: number | null;
  /** 0–100. */
  positivePercent: number | null;
  memberSince: string | null;
  location: string | null;
  followersCount: number | null;
  followingCount: number | null;
  listingsCount: number | null;
  soldCount: number | null;
  purchasesCount: number | null;
  verified: boolean | null;
  badges: string[];
  source: BuyerProfileSource;
  fetchedAt: string | null;
  fetchStatus: BuyerProfileFetchStatus;
}

/** Stats over ALL of a buyer's orders with you. */
export interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number | null;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  daysSinceLastOrder: number | null;
  platformsCount: number;
  cancelledCount: number;
  returnsCount: number;
  disputesCount: number;
  messagesCount: number;
  offersCount: number;
  repeatBuyer: boolean;
}

export interface CustomerBestRating {
  value: number;
  count: number | null;
  platform: string;
}

/** One row of `customers.list()`. */
export interface CustomerListRow {
  normalizedHandle: string;
  platforms: string[];
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  firstOrderAt: string | null;
  avatarUrl: string | null;
  displayName: string | null;
  bestRating: CustomerBestRating | null;
}

/** `customers.get()` — the order page plus profiles + stats. */
export interface CustomerDetail {
  normalizedHandle: string;
  platforms: string[];
  totalOrders: number;
  totalSpent: number;
  orders: Array<Record<string, unknown>>;
  contact: Record<string, unknown>;
  profiles: BuyerProfile[];
  stats: CustomerStats;
}

/** `customers.refreshProfile()` — what was queued, per platform. */
export interface CustomerProfileRefresh {
  handle: string;
  platforms: Array<{ platform: string; queued: boolean; reason: string | null }>;
}
