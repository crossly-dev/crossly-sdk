import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Vault Markets alerts hub ───────────────────────────────────────────────
//
// `client.vaultMarkets.alertsHub`. Which kinds of vault alert go to which
// channel (push, Telegram, the desktop terminal, a daily email digest,
// outbound webhooks of the event "vault.alert"), quiet hours, a test alert,
// and the log of what the hub did. Every alert is also in the notification
// bell whatever the switches say. Margin calls, ADL and P2P loan events always
// push and ignore quiet hours.

export type VaultAlertKind =
  | 'price' | 'fill' | 'margin_call' | 'adl' | 'p2p_loan' | 'auction' | 'market_open' | 'receipt_token' | 'set_goal' | 'follow' | 'account';

export type VaultAlertChannel = 'push' | 'telegram' | 'terminal' | 'email' | 'webhook';

/** send = goes out; off = switched off; quiet = held by quiet hours; unavailable = the channel is not set up. */
export type VaultAlertChannelPlan = 'send' | 'off' | 'quiet' | 'unavailable';

export interface VaultQuietHours {
  /** 'HH:MM', 24-hour. */
  start: string;
  end: string;
  /** IANA time zone, e.g. 'America/New_York'. */
  tz: string;
}

export interface VaultAlertKindInfo { key: VaultAlertKind; label: string; hint: string; critical: boolean; nudge: boolean }

export interface VaultAlertChannelInfo { key: VaultAlertChannel; label: string; hint: string; ready: boolean; note: string | null }

export interface VaultAlertSettings {
  kinds: VaultAlertKindInfo[];
  channels: VaultAlertChannelInfo[];
  /** The full grid, defaults filled in. */
  matrix: Record<VaultAlertKind, Record<VaultAlertChannel, boolean>>;
  /** Switches that cannot be turned off (a critical kind's push). */
  locked: Array<{ kind: VaultAlertKind; channel: VaultAlertChannel }>;
  quietHours: VaultQuietHours | null;
  quietNow: boolean;
  telegram: { linked: boolean; on: boolean };
  pushCapPerDay: number;
  emailDigestHourUtc: number;
  webhookEvent: string;
}

export interface VaultAlertSettingsPatch {
  /** { kind: { channel: true | false } }, merged onto what is set. */
  matrix?: Partial<Record<VaultAlertKind, Partial<Record<VaultAlertChannel, boolean>>>>;
  /** null clears quiet hours. */
  quietHours?: VaultQuietHours | null;
  /** The Telegram master switch. */
  telegram?: boolean;
}

export interface VaultAlertTestResult {
  sent: boolean;
  kind: VaultAlertKind;
  plan: Record<VaultAlertChannel, VaultAlertChannelPlan>;
}

export interface VaultAlertLogEntry {
  id: string;
  kind: VaultAlertKind;
  label: string;
  title: string;
  body: string | null;
  href: string | null;
  /** Channels it went to. */
  sent: string[];
  /** 'channel:reason' (quiet, cap, settings, unlinked). */
  held: string[];
  /** null | 'pending' | 'sent' | 'skipped' | 'failed' */
  emailState: string | null;
  createdAt: string;
}

export interface VaultAlertLogList { data: VaultAlertLogEntry[] }

export class VaultMarketsAlertsHubResource {
  constructor(private http: HttpClient) {}

  /** Your vault alert settings: kinds, channels (and whether each is set up), the grid, quiet hours. */
  get() {
    return this.http.request<VaultAlertSettings>({ method: 'GET', path: '/v1/vault-markets/alert-prefs' });
  }

  /** Change switches, quiet hours or the Telegram master switch. Returns the new settings. */
  update(body: VaultAlertSettingsPatch, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultAlertSettings>({ method: 'PUT', path: '/v1/vault-markets/alert-prefs', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Send yourself one test alert of a kind; returns what each channel did with it. */
  test(kind: VaultAlertKind, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultAlertTestResult>({ method: 'POST', path: '/v1/vault-markets/alert-prefs/test', body: { kind }, idempotencyKey: opts.idempotencyKey });
  }

  /** What the hub did with your recent alerts (limit 1..200, default 50). */
  log(limit?: number) {
    return this.http.request<VaultAlertLogList>({ method: 'GET', path: '/v1/vault-markets/alert-log', query: limit ? { limit } : undefined });
  }
}
