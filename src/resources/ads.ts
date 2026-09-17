/**
 * Offsite ads — `/api/v1/ads/*`.
 *
 * A separate resource because it is a separate product. Authenticated by
 * the same `cbx_` merchant key, since it is the same merchant either
 * way and a second credential would be a second thing to leak, rotate
 * and revoke for no gain.
 *
 * The budget lives in CBX (`client.cbx.ads.adCredit()`); everything here
 * is about what that budget buys on external networks.
 */
import type { HttpClient, JsonObject } from './_shared.js';

export type OffsiteNetwork = 'google' | 'meta' | 'tiktok' | 'reddit' | 'pinterest';

export class AdsResource {
  constructor(private http: HttpClient) {}

  /**
   * Your offsite-ads opt-in and its terms.
   *
   * Offsite ads spend your CBX advertising budget on external networks
   * at our discretion. Your item gets promoted; the traffic lands on
   * Crossly.
   *
   * OFF unless you turn it on, and nothing enables it on your behalf.
   *
   * Media is passed through AT COST with a separate, disclosed
   * management fee, so you can always see how much of your budget
   * reached the auction.
   *
   * `networkWired` false means no ad network is connected yet — the
   * campaign endpoint will refuse rather than report a campaign that
   * does not exist.
   */
  offsite() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/ads/offsite' });
  }

  /**
   * Turn offsite ads on or off. Yours alone to set.
   *
   * `maxOffsiteShareBps` caps how much of your budget may leave the
   * platform, so opting in does not mean discovering the whole thing
   * went to Google.
   *
   * `minReturnBps` is a STOP, not a guarantee: below it, offsite spend
   * auto-pauses and the rest reverts to on-platform placement. Nobody
   * can honestly promise ad performance; what can be promised is that
   * it stops. 20000 means $2 of attributed revenue per $1 spent.
   *
   * Toggling either way clears any existing auto-pause, so turning it
   * back on later does not inherit a pause from months ago.
   *
   * When one of your ads brings a buyer who purchases somebody ELSE's
   * item, you are credited back a share of that revenue in advertising
   * credit — you paid for the click, so you get paid for the outcome.
   */
  setOffsite(params: {
    enabled: boolean;
    maxOffsiteShareBps?: number;
    minReturnBps?: number;
    returnWindowDays?: number;
    allowedNetworks?: OffsiteNetwork[];
  }) {
    return this.http.request<JsonObject>({
      method: 'PUT',
      path: '/v1/ads/offsite',
      body: params,
    });
  }

  /**
   * What your offsite budget bought — including the misses.
   *
   * Spend, impressions and clicks are reported whether or not anything
   * converted. A report showing only conversions is a report nobody can
   * audit, and this is a feature where you handed over discretion over
   * your own money.
   *
   * `mediaCostCents` against `managementFeeCents` answers "how much of
   * my budget reached the auction" — recorded separately so the answer
   * survives.
   *
   * `spilloverConversions` is sales your ads produced on OTHER sellers'
   * items, and `spilloverCreditedCents` is what came back to you for
   * them.
   */
  offsiteReport(params?: { sinceDays?: number }) {
    const q = params?.sinceDays ? `?sinceDays=${params.sinceDays}` : '';
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/ads/offsite/report${q}`,
    });
  }

  /**
   * Whether an item can run offsite, and why not.
   *
   * Reasons: `not_opted_in`, `auto_paused`, `network_not_allowed`,
   * `category_not_allowlisted`, `no_adapter`, `no_budget`.
   *
   * The category check is an ALLOWLIST, so an unclassified category is
   * not eligible. Ad networks suspend the ACCOUNT over a prohibited
   * item, and that account is one shared resource across every merchant
   * using this — so one listing could take offsite ads away from all of
   * them.
   */
  offsiteEligibility(params: { network: OffsiteNetwork; category: string }) {
    const q = new URLSearchParams({ network: params.network, category: params.category });
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/ads/offsite/eligibility?${q.toString()}`,
    });
  }

  /**
   * Clear an auto-pause and resume offsite spend.
   *
   * 409 when you are not actually paused. Read the pause reason first —
   * resuming without changing anything usually just trips the floor
   * again over the next window.
   */
  resumeOffsite() {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/ads/offsite/resume',
    });
  }

  /**
   * Launch an offsite campaign for an item.
   *
   * Creative is built from the structured fields you pass — title,
   * condition as you recorded it, price, image. No prose is generated
   * and no claims are invented: an ad saying "mint" or "authenticated"
   * when your listing says neither is a misrepresentation we authored
   * and YOU would take the dispute for.
   *
   * Refuses with 403 when no network is wired, rather than returning a
   * campaign that does not exist.
   */
  createOffsiteCampaign(params: {
    network: OffsiteNetwork;
    listingId?: string | null;
    category: string;
    title: string;
    condition?: string;
    priceCents: number;
    imageUrl?: string;
    landingUrl: string;
    dailyBudgetCents: number;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/ads/offsite/campaigns',
      body: params,
    });
  }
}
