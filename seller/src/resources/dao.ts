/**
 * The Crossly DAO — `/api/v1/dao/*`.
 *
 * Staked CBX decides what the events pool funds. Voting power is size x
 * tenure and is SNAPSHOTTED when a proposal opens, so staking after
 * seeing one grants no vote on it.
 *
 * ── WHAT THIS RESOURCE CANNOT DO ─────────────────────────────────────
 * Move money. A passed proposal sets a status; disbursing goes through a
 * campaign with a preview and a human approval. There is no execute
 * method here, deliberately.
 *
 * ── AND WHAT IT REFUSES TO EXPRESS ───────────────────────────────────
 * A proposal whose beneficiaries are the voters. `beneficiaryKind` has
 * no stakers, holders, airdrop or distribution option, in this type, in
 * the service, and in a database CHECK. A distribution decided by its
 * own recipients is a dividend whatever it is called, so the DAO decides
 * WHAT to fund and never WHO gets paid.
 */
import type { HttpClient, JsonObject } from './_shared.js';

export type BeneficiaryKind =
  | 'community_event'
  | 'grant'
  | 'charity'
  | 'marketing'
  | 'policy';

export type VoteChoice = 'for' | 'against' | 'abstain';

export class DaoResource {
  constructor(private http: HttpClient) {}

  /**
   * The proposal queue.
   *
   * `meta` carries the thresholds — minimum weight to propose and to
   * vote, the in-flight and monthly limits, and the default window — so
   * a UI can explain a refusal before it happens.
   */
  proposals(filters?: { status?: string; limit?: number }) {
    const query: Record<string, string> = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.limit !== undefined) query.limit = String(filters.limit);
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/dao/proposals',
      query: Object.keys(query).length ? query : undefined,
    });
  }

  /**
   * Raise a proposal. Starts as a DRAFT — call `open` to put it to a
   * vote.
   *
   * Requires staked CBX above the minimum, one in-flight proposal at a
   * time, and a capped number per month. Those limits bound a denial of
   * ATTENTION rather than of service.
   *
   * A `policy` proposal requests no funds and must omit
   * `requestedBaseUnits`; every other kind must supply it — except a
   * `charity` proposal carrying a `charityGoal`, whose amount is the pile of
   * users' gifts at announcement and may be left open.
   *
   * `charityGoal` (charity proposals only): the cause it would fund —
   * `charitySlug` is a vetted charity or `'crossly-cares'` for a program the
   * charity runs itself, plus a title, mission and dollar target in cents.
   */
  propose(input: {
    subjectId: string;
    title: string;
    body: string;
    beneficiaryKind: BeneficiaryKind;
    beneficiaryNote?: string;
    requestedBaseUnits?: string;
    quorumBps?: number;
    passThresholdBps?: number;
    charityGoal?: { charitySlug: string; title: string; mission: string; targetCents: number; endsAt?: string };
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/dao/proposals',
      body: input,
    });
  }

  /**
   * Put your own draft to a vote. Snapshots voting power.
   *
   * ONLY THE PROPOSER may open their draft — opening puts something to a
   * binding vote in their name.
   *
   * Refuses when nobody holds enough staked CBX to vote, because opening
   * then would guarantee a failed quorum and waste the window.
   */
  open(proposalId: string, input: { subjectId: string; votingDays?: number }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/dao/proposals/${encodeURIComponent(proposalId)}/open`,
      body: input,
    });
  }

  /**
   * Withdraw your own DRAFT.
   *
   * Drafts only. Withdrawing an open proposal would discard votes
   * already cast, which is the proposer overruling the electorate.
   */
  withdraw(proposalId: string, subjectId: string) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/dao/proposals/${encodeURIComponent(proposalId)}`,
      body: { subjectId },
    });
  }

  /**
   * Cast or change a vote while the window is open.
   *
   * ABSTAIN counts toward turnout and not toward approval — it lets you
   * help a proposal clear quorum without taking a side.
   */
  vote(
    proposalId: string,
    input: { subjectId: string; choice: VoteChoice; reason?: string },
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/dao/proposals/${encodeURIComponent(proposalId)}/vote`,
      body: input,
    });
  }

  /** The live count. */
  tally(proposalId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/dao/proposals/${encodeURIComponent(proposalId)}/tally`,
    });
  }

  /**
   * Operator block. There is no matching power to PASS.
   *
   * Deliberately asymmetric: a power to pass would make every vote
   * advisory theatre. The reason is mandatory and stored, and should be
   * written expecting to be read.
   */
  veto(proposalId: string, input: { reason: string; vetoedByUserId: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/dao/proposals/${encodeURIComponent(proposalId)}/veto`,
      body: input,
    });
  }

  /** Close a proposal whose window has passed. Records an outcome only. */
  finalise(proposalId: string) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/dao/proposals/${encodeURIComponent(proposalId)}/finalise`,
    });
  }
}
