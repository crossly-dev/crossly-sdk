import type { HttpClient, JsonObject, IdempotencyOpts } from './_shared.js';

export type UnitIdNamespace = 'serial' | 'imei' | 'licence_key' | 'gtin' | 'custom';

/**
 * Where the identifier came from. This is a hint recorded alongside the value,
 * not a claim the server takes at face value — `strength` below is re-derived
 * from the recording timestamp against the sale.
 */
export type UnitIdSource = 'intake' | 'packing' | 'import' | 'manual' | 'dispute';

/**
 * What an identifier proves, not how good the value is.
 *
 * - `strong` — recorded before the item sold, so it cannot have been chosen
 *   to fit a specific dispute.
 * - `good` — recorded at packing, contemporaneous with shipping.
 * - `weak` — first recorded after it shipped.
 */
export type IdentityStrength = 'strong' | 'good' | 'weak';

export interface UnitIdentifier {
  namespace: UnitIdNamespace;
  value: string;
  source: UnitIdSource;
  recordedAt: string;
  strength: IdentityStrength;
}

export interface InventoryUnit {
  id: string;
  status: string;
  orderId: string | null;
  soldAt: string | null;
  notes: string | null;
  createdAt: string;
  identifiers: UnitIdentifier[];
}

export interface RecordIdentifierBody {
  value: string;
  namespace?: UnitIdNamespace;
  source?: UnitIdSource;
  /** Attach to an existing unit rather than creating one. */
  unitId?: string;
  notes?: string;
}

// ─── Per-unit identity (serials, IMEIs, licence keys) ───────────────────────
//
// The point of all of this is one question on a return: "is the thing they
// sent back the thing I shipped?" Inventory is quantity-based, so without a
// recorded identifier the honest answer is always "no idea" — which is the gap
// serial-swap fraud lives in. Record at intake, before it sells; anything
// recorded later is graded `weak` and says so.

export class UnitsResource {
  constructor(private http: HttpClient) {}

  /** Units of an inventory item, each identifier graded. Envelope: `{ data }`. */
  listForItem(inventoryItemId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/inventory/${encodeURIComponent(inventoryItemId)}/units`,
    });
  }

  /**
   * What physically shipped on an order — the dispute-time read.
   *
   * An empty list means no identity was recorded, NOT that the order shipped
   * nothing. Those are different facts and the API keeps them distinct.
   */
  listForOrder(orderId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/orders/${encodeURIComponent(orderId)}/units`,
    });
  }

  /** Record a serial against an item, creating the unit if needed. */
  record(inventoryItemId: string, body: RecordIdentifierBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/inventory/${encodeURIComponent(inventoryItemId)}/units/identifiers`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  /**
   * "Have I ever seen this serial?" — for a unit that arrives back with no
   * paperwork. Scoped to your own account.
   */
  lookup(body: { value: string; namespace?: UnitIdNamespace }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/inventory/units/lookup',
      body,
    });
  }
}
