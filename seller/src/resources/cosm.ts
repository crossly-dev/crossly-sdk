/**
 * COSM — the metaverse cosmetics currency. `/api/v1/cosm/*`.
 *
 * A separate resource because it is a separate token with the opposite
 * properties to CBX:
 *
 *   CBX   fixed supply · backed by a reserve · spends RECIRCULATE
 *   COSM  minted on demand · backed by nothing · spends BURN
 *
 * Authenticated by the same `cbx_` merchant key — it is the same
 * merchant either way, and a third credential would be a third thing to
 * leak, rotate and revoke for no gain.
 *
 * ── EVERY AMOUNT IS A STRING OF BASE UNITS ───────────────────────────
 * COSM has SIX decimals, so ten thousand COSM is `"10000000000"`. They
 * are strings because a JSON number loses precision past 2^53 — about
 * nine billion COSM — which would work in testing and corrupt balances
 * at scale. Divide by 1e6 to display, and use a bigint or a decimal
 * library to do arithmetic, never a float.
 *
 * ── THE WITHDRAWAL METHODS EXIST AND REFUSE TODAY ────────────────────
 * COSM does not leave the platform yet, so `requestWithdrawal` returns a
 * 409 listing the outstanding preconditions. Call `withdrawals()` and
 * read `meta.open` before offering it in a UI, and do not present a
 * date — none of the preconditions has one.
 *
 * What does not exist at any setting is a USER-TO-USER send. The auction
 * house moves COSM between users, but only through a matched listing for
 * amounts derived from it. There is no free-form transfer method and
 * there is not going to be one.
 *
 * ── WHERE THE METHODS LIVE ───────────────────────────────────────────
 * `CosmResource` is one class with one method set, and callers see
 * nothing else: `client.cosm.balance()`, `client.cosm.setPeg()`,
 * `client.cosm.materialise()`. The bodies are grouped across `./cosm/*`
 * only because a single file had outgrown the repo's size cap, and they
 * are chained by inheritance rather than nested under sub-objects
 * precisely so that no call path moved:
 *
 *   base → currency → cosmetics → market → designer → CosmResource
 */
import { CosmDesignerMethods } from './cosm/designer.js';

export type { CosmeticTier } from './cosm/types.js';

export class CosmResource extends CosmDesignerMethods {}
