/**
 * The designer surface.
 *
 * A designer is a different reader from a wearer: these are about
 * publishing terms, opening a design to the chain, and the mint state
 * machine. Grouped with COSM rather than in their own resource because
 * they share the COSM credential and a designer is also a holder.
 *
 * The last link in the `CosmResource` chain — see `./base.js`. Every method
 * here is reached as `client.cosm.<name>()`.
 */
import type { JsonObject } from '../_shared.js';
import { CosmMarketMethods } from './market.js';

export class CosmDesignerMethods extends CosmMarketMethods {
  /**
   * The published terms for a design.
   *
   * Reports the platform rates a designer does NOT control alongside
   * the ones they do, and whether the terms are enforceable on chain —
   * inside Crossly every rule is enforced, while a third-party
   * marketplace honours a royalty voluntarily at best. Present that
   * distinction to a designer rather than implying a guarantee.
   */
  designerTerms(params: { cosmeticId: string }) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/designer/terms',
      query: params,
    });
  }

  /**
   * Publish terms for a design.
   *
   * NEVER an edit: every change is a new version, and a copy sold under
   * an earlier one keeps those terms forever. Designer-only.
   *
   * `splits` are shares of the ROYALTY, not of the sale price, and may
   * total at most 100% — the remainder stays with the designer. A total
   * above 100% is refused rather than scaled down, because silently
   * rescaling somebody's collaborator agreement is worse than an error.
   */
  publishDesignerTerms(params: {
    subjectId: string;
    cosmeticId: string;
    resaleAllowed?: boolean;
    /** Base units, as a digit string. Null clears the bound. */
    maxResaleBaseUnits?: string | null;
    minResaleBaseUnits?: string | null;
    secondaryRoyaltyBps?: number;
    splits?: Array<{
      recipientSubjectId: string;
      shareBps: number;
      memo?: string | null;
    }>;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cosm/designer/terms',
      body: params,
    });
  }

  /**
   * Burn COSM to make a design mintable on chain.
   *
   * Designer-only and idempotent: a second call returns the existing
   * unlock without charging, so paying twice is impossible. The fee is
   * DESTROYED rather than collected. Limited editions only — an open
   * edition has no scarcity for a token to attest.
   *
   * Once unlocked, ANY holder may take their own copy on chain. That is
   * deliberate: restricting it to the designer would leave buyers
   * holding something they cannot take with them.
   */
  unlockDesignForChain(params: { subjectId: string; cosmeticId: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cosm/designer/chain-unlock',
      body: params,
    });
  }

  /**
   * Opt a design in or out of the FREE chain unlock a popular limited design
   * earns (on by default). Answers the popularity of the design toward the bar.
   */
  setChainAutoUnlock(params: { subjectId: string; cosmeticId: string; enabled: boolean }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cosm/designer/chain-auto-unlock',
      body: params,
    });
  }

  /**
   * Submit a user-authored design for moderation.
   *
   * Refuses a design with no preview image here rather than at approval,
   * so the designer learns what is missing while they can still fix it.
   * Submitting twice returns the existing pending review instead of
   * queueing a second one — a moderator facing two reviews of one piece
   * does not know which they are deciding.
   */
  submitDesignForReview(params: { subjectId: string; cosmeticId: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cosm/designer/submit-for-review',
      body: params,
    });
  }

  /**
   * Lock a copy and get back an UNSIGNED mint for the holder to sign.
   *
   * One call: it resolves the royalty, locks the copy, publishes
   * immutable content-addressed metadata and builds the transaction — so
   * a lock is never taken without a transaction to go with it, and a
   * failure after the lock releases it.
   *
   * `destinationOwner` is the holder's OWN wallet. The platform never
   * holds the NFT; minting into a platform wallet and transferring later
   * is custody.
   *
   * Does NOT void the copy. Call {@link confirmMaterialisation} once the
   * chain reaches FINALIZED commitment, or {@link releaseMaterialisation}
   * if the user closed the prompt.
   */
  materialise(params: {
    subjectId: string;
    ownershipId: string;
    destinationOwner: string;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cosm/designer/materialise',
      body: params,
    });
  }

  /**
   * Record a confirmed mint and retire the in-world copy, in one
   * transaction.
   *
   * You MUST have verified the transaction at finalized commitment
   * first. An NFT recorded against a transaction that never landed
   * cannot be recalled, and the copy it retired is gone. Idempotent on
   * an already-confirmed request.
   */
  confirmMaterialisation(params: {
    mintRequestId: string;
    mintAddress: string;
    txSig: string;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cosm/designer/materialise/confirm',
      body: params,
    });
  }

  /**
   * Release a mint lock that was never signed.
   *
   * The ordinary outcome of somebody closing a wallet prompt, and it
   * leaves the copy exactly as it was. Refuses a request that has
   * already minted — releasing one would unlock a copy that is on chain,
   * which is the double-spend the whole state machine exists to prevent.
   */
  releaseMaterialisation(params: { mintRequestId: string; reason: string }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cosm/designer/materialise/release',
      body: params,
    });
  }

  /**
   * Where a copy currently is: `held`, `minting` or `materialised`.
   *
   * A copy is in exactly one of these, never two. Both at once would be
   * a double-spend — sell the NFT, keep wearing the item, and one
   * edition has two owners who can each prove it.
   */
  copyState(params: { ownershipId: string }) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/designer/copy-state',
      query: params,
    });
  }

  /**
   * What a designer has earned, in both denominations.
   *
   * COSM royalties come from COSM-priced sales; cash earnings come from
   * cash-priced sales and are funded by the buyer payment itself. The
   * two are never converted into one another, and COSM is never cashed
   * out — so show them as two figures, never as a total.
   */
  designerEarnings(params: { subjectId: string }) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/cosm/designer/earnings',
      query: params,
    });
  }
}
