/**
 * The root of the COSM method groups.
 *
 * `CosmResource` is ONE class to everybody who calls it —
 * `client.cosm.balance()` and `client.cosm.materialise()` sit on the same
 * object, and that is the documented contract. The file was simply too long
 * to read, so the methods were grouped into siblings and chained by
 * inheritance rather than moved behind a delegate: inheritance is the only
 * split that leaves every method name, signature and call path exactly where
 * it was.
 *
 * Each group extends the previous one and `CosmResource` extends the last, so
 * the chain collapses back into a single class at the public entry point.
 *
 * `http` is `protected` rather than `private` for exactly that reason — a
 * group in a sibling file has to reach it. It is still not part of the public
 * surface.
 */
import type { HttpClient } from '../_shared.js';

export abstract class CosmBase {
  constructor(protected http: HttpClient) {}
}
