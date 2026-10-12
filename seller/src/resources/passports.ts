import type { HttpClient } from './_shared.js';

/**
 * Product passports (seller side): a tag on the physical item — NFC or a
 * printed QR, carrying `url` — that opens its provenance on Crossly.
 * Ownership follows the item's paid sales, never the tag.
 */
export interface SellerPassport {
  id: string;
  code: string;
  /** The passport page. */
  url: string;
  /** Write this to the NFC tag (NDEF URI record) — taps are counted. */
  nfcUrl: string;
  /** Print this as the QR — scans are counted. */
  qrUrl: string;
  platformListingId: string;
  /** active | revoked */
  status: string;
  tagUid: string | null;
  /** The tag was made read-only after writing. */
  tagLocked: boolean;
  tagWrittenAt: string | null;
  nfcScans: number;
  qrScans: number;
  lastScannedAt: string | null;
  /** The current owner has tapped it since buying. */
  claimedAt: string | null;
  createdAt: string;
}

/** What a passport tag opens (also `buyer.passports.get`). Never who or for how much. */
export interface Passport {
  code: string;
  url: string;
  status: string;
  item: { title: string | null; brand: string | null; imageUrl: string | null };
  authenticated: { certificateUrl: string | null; at: string | null } | null;
  owners: number;
  history: Array<{ since: string }>;
  holder: { kind: 'seller' } | { kind: 'owner'; since: string };
  inOwnersHands: boolean;
  youOwnIt: boolean;
  registeredAt: string;
  hasNfcTag: boolean;
}

/** Passports. Reading needs `listings:read`; registering and revoking `listings:write`. */
export class PassportsResource {
  constructor(private http: HttpClient) {}

  list(params: { platformListingId?: string } = {}) {
    return this.http.request<{ data: SellerPassport[] }>({ method: 'GET', path: '/v1/passports', query: params });
  }

  /** Register one for a Crossly listing you sell, optionally bound to an NFC tag UID (hex). */
  register(input: { platformListingId: string; tagUid?: string }) {
    return this.http.request<{ data: SellerPassport }>({ method: 'POST', path: '/v1/passports', body: input });
  }

  /** A lost or misprinted tag — refused once the item has sold. */
  /** Bind (or re-bind) the passport to the NFC tag you wrote `nfcUrl` to — before the item sells. */
  bindTag(id: string, input: { tagUid: string; locked?: boolean; written?: boolean }) {
    return this.http.request<{ data: SellerPassport }>({ method: 'POST', path: `/v1/passports/${encodeURIComponent(id)}/tag`, body: input });
  }

  revoke(id: string) {
    return this.http.request<{ data: SellerPassport }>({ method: 'POST', path: `/v1/passports/${encodeURIComponent(id)}/revoke` });
  }
}

/** Passports, buyer side (`buyer.passports`): read what a tag opens; claim it as the current owner. */
export class BuyerPassportsResource {
  constructor(private http: HttpClient) {}

  get(code: string) {
    return this.http.request<{ data: Passport }>({ method: 'GET', path: `/v1/buyer/passports/${encodeURIComponent(code)}` });
  }

  claim(code: string, input: { tagUid?: string } = {}) {
    return this.http.request<{ data: Passport }>({ method: 'POST', path: `/v1/buyer/passports/${encodeURIComponent(code)}/claim`, body: input });
  }
}
