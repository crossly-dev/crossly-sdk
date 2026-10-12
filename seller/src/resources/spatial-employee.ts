import type { HttpClient, JsonObject, IdempotencyOpts } from './_shared.js';

/** One heuristic rule: when TRIGGER happens, do ACT. First match wins. */
export interface EmployeeRuleInput {
  /** entered | lingered | inspected | added_to_cart | leaving_with_cart | asked */
  when: string;
  /** Seconds of dwell before `lingered` counts. Ignored for other triggers. */
  afterSeconds?: number;
  do: {
    /** approach | say | offer | point | idle */
    act: string;
    /** Spoken line. Printable ASCII, 180 chars. */
    line?: string;
    /** A key into YOUR offers. Never an amount — the server prices it. */
    offerId?: string;
    itemId?: string;
  };
}

export interface EmployeeConfigInput {
  sceneId: string;
  enabled: boolean;
  displayName: string;
  brainKind: 'idle' | 'rules' | 'agent';
  avatarKey?: string;
  rules?: EmployeeRuleInput[];
  /** Your own endpoint. Validated against private address space on save. */
  agentEndpointUrl?: string | null;
  /** Mint a fresh signing secret. Returned once, in that response only. */
  rotateSecret?: boolean;
}

/**
 * The shop employee: a per-room attendant, and what it costs.
 *
 * An employee greets visitors in one of your 3D rooms. It is simulated on each
 * visitor's own client — everybody gets their own attendant who walks to THEM —
 * and billed in COSM per engaged customer-minute while it is actually talking
 * to somebody. One standing in an empty shop costs nothing, so leaving one
 * switched on is free and quiet hours are not punished.
 *
 * ── THIS RESOURCE CANNOT START A CONVERSATION, AND THAT IS THE POINT ──
 * There is no `engage()` or `disengage()` here, and there is no endpoint
 * behind one. Engagements are in-world signals a room emits as it is drawn for
 * a real visitor, and emitting one OPENS A BILLABLE SESSION. A programmatic
 * caller able to send them would be a way to bill a seller — possibly somebody
 * else's seller — for conversations that never happened, at a per-minute rate,
 * for as long as a loop is left running. So the public API gives an OWNER the
 * two things an owner needs: change the settings, and read the bill.
 *
 * ── THE SIGNING SECRET IS HANDED OVER ONCE ───────────────────────────
 * `saveConfig()` returns `secret` only in the response that MINTED it — when
 * you pass `rotateSecret: true`, or when you first set an agent endpoint on a
 * room that had none. Store it at that moment. It is encrypted at rest and no
 * read path will return it again; `config.hasAgentSecret` is all `getConfig()`
 * will ever say. A secret a settings page can re-read is a secret in every
 * screenshot of that page.
 *
 * ── READING THE MONEY ────────────────────────────────────────────────
 * `billedCents` is COSM cents actually charged. `burnBaseUnits` and
 * `poolBaseUnits` are COSM base units as STRINGS, because they are 64-bit
 * integers — half of every fee is destroyed and half moves to a reward pool.
 * Open conversations contribute zero to every money field until they settle,
 * so a total read mid-conversation is a floor, not a final figure.
 */
export class SpatialEmployeeResource {
  constructor(private http: HttpClient) {}

  /**
   * How the employee in one of your rooms is configured.
   *
   * Owner-only: a room you do not own answers 404, exactly as one that does
   * not exist does. `config: null` means the room has never had an employee —
   * different from one that exists and is switched off (`enabled: false`).
   *
   * `suspendedAt` non-null means the employee is off the floor because a
   * charge was refused, with `suspendedReason` saying which; saving the config
   * again puts it back. Needs `automation:read`.
   */
  getConfig(sceneId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/spatial/employee/config',
      query: { sceneId },
    });
  }

  /**
   * Create or replace the employee in a room. A full REPLACE, not a patch —
   * read `getConfig()` first and send it back changed.
   *
   * `brainKind: 'rules'` evaluates `rules` in order, first match wins, up to
   * twelve. Nothing in a rule carries a price: `do.offerId` is a key into your
   * own offers and the server decides what it is worth, so an employee can
   * propose a discount it has no power to grant. `displayName` and `do.line`
   * must be printable ASCII — they are drawn in the room from a fixed glyph
   * atlas, and anything else renders as a floating box, so they are refused
   * rather than silently rewritten.
   *
   * `brainKind: 'agent'` needs `agentEndpointUrl`, which is resolved and
   * checked against private address space BEFORE it is stored: a
   * public-looking hostname that answers with an internal address is refused
   * here, with a sentence, rather than accepted and then quietly never called.
   *
   * Saving anything CLEARS a suspension. Pass an idempotency key if you might
   * retry a rotation — without one a retried `rotateSecret` mints a second
   * secret and invalidates the one you were just given. Needs
   * `automation:write`.
   */
  saveConfig(params: EmployeeConfigInput, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PUT',
      path: '/v1/spatial/employee/config',
      body: params,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  /**
   * What your employees cost over a period, one row per room.
   *
   * `since`/`until` are ISO 8601 and default to the last 30 days; a window may
   * span at most 366 days, and a longer one is a 400 rather than a silently
   * shortened period. Rooms with no conversations in the window are ABSENT,
   * not reported as zero.
   *
   * `meta.totals` is the same window summed in the database rather than the
   * sum of the rows. `unpaidConversations` settled WITHOUT payment — you were
   * short of COSM, or COSM is not live — and each of those also suspended the
   * employee in that room. They are not a debt and are never retried.
   * Needs `analytics:read`.
   */
  usage(params: { since?: string; until?: string } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/spatial/employee/usage',
      query: params,
    });
  }

  /**
   * The itemised bill: one row per customer-conversation, newest first.
   *
   * This is what makes a usage total checkable by hand. `engagedMs` is
   * SERVER-measured, from two timestamps the server wrote — nothing in this
   * feature lets a client report its own duration — and it is null, not zero,
   * while a conversation is still running.
   *
   * No row names the customer. Billing is per customer, but a bill is an
   * account of what was spent rather than a list of who walked in.
   * Needs `analytics:read`.
   */
  sessions(
    params: {
      since?: string;
      until?: string;
      sceneId?: string;
      unpaidOnly?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/spatial/employee/sessions',
      query: params,
    });
  }
}
