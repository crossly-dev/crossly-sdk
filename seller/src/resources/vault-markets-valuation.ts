import type { HttpClient } from './_shared.js';

// ─── Vault Markets insurance and appraisal statements ──────────────────────
//
// `client.vaultMarkets.valuation`. A statement lists the vault units you held
// on a chosen day, each at its Crossly mark that day (the order book's price
// for its exact item, condition and grade, and nothing else) with the mark's
// quality, the last eligible trade in its market, its grade and cert, unit id
// and warehouse receipt, and the total of the marked units. Purpose
// 'insurance' is a replacement-value schedule; 'appraisal' adds the
// methodology. Issuing freezes it with a sha256 and seals it in the Crossly
// audit chain; `verify(id)` shows anyone the totals and hash, never the
// holder. Money fields are integer CENTS of US dollars.
//
// The PDF is binary: every SDK call decodes the body as text, so there is no
// PDF method. Fetch `/v1/vault-markets/valuation-statements/:id/pdf` with
// your token for it; `get(id)` returns every figure on it as JSON.

export type ValuationPurpose = 'insurance' | 'appraisal';
export type ValuationMarkQuality = 'A' | 'B' | 'C' | 'none';

export interface ValuationUnit {
  vaultItemId: string;
  receiptNo: string | null;
  bookKey: string;
  title: string;
  categoryName: string | null;
  condition: string;
  /** "PSA 10"; null = ungraded. */
  grade: string | null;
  grader: string | null;
  certNo: string | null;
  markCents: number | null;
  markQuality: ValuationMarkQuality;
  markDay: string | null;
  lastTrade: { cents: number; at: string } | null;
  /** What the statement counts the unit at (the mark); null = no mark, left out of the total. */
  valueCents: number | null;
  pledged: boolean;
  /** The value the vault's own policy carries for the unit while in custody, if recorded. */
  vaultInsuredCents: number | null;
}

export interface ValuationQualityBucket {
  units: number;
  cents: number;
}

export interface ValuationTotals {
  units: number;
  markedUnits: number;
  unmarkedUnits: number;
  pledgedUnits: number;
  totalCents: number;
  byQuality: Record<ValuationMarkQuality, ValuationQualityBucket>;
}

export interface ValuationSeal {
  auditSeq: number | null;
  auditHash: string | null;
}

export interface ValuationStatement {
  kind: 'crossly-valuation-statement';
  version: string;
  /** Null on a preview. */
  id: string | null;
  purpose: ValuationPurpose;
  title: string;
  asOf: string;
  issuedAt: string;
  account: { label: string; kind: 'individual' | 'subaccount'; subaccountId: string | null };
  preparedFor: string | null;
  policyRef: string | null;
  units: ValuationUnit[];
  totals: ValuationTotals;
  methodology: string[];
  notes: string[];
  verifyUrl: string | null;
  venue: string;
  issued: boolean;
  /** sha256 of the frozen record; null on a preview. */
  hash: string | null;
  seal: ValuationSeal | null;
  /** On `get`: the verify link and a QR image of it (a PNG data URL). */
  verify?: { url: string; qrDataUrl: string | null };
}

export interface ValuationSummary {
  id: string;
  purpose: ValuationPurpose;
  title: string;
  asOf: string;
  issuedAt: string;
  hash: string;
  units: number;
  markedUnits: number;
  totalCents: number;
  verifyUrl: string;
}

export interface ValuationSummaryList {
  data: ValuationSummary[];
}

export interface ValuationVerify {
  id: string;
  purpose: ValuationPurpose;
  title: string;
  asOf: string;
  issuedAt: string;
  methodVersion: string;
  totals: Omit<ValuationTotals, 'pledgedUnits'>;
  hash: string;
  /** With a hash given: whether it is this statement's. */
  hashMatches: boolean | null;
  /** The stored record still hashes to `hash`. */
  intact: boolean;
  seal: { auditSeq: number | null; ok: boolean };
  verdict: 'valid' | 'mismatch' | 'altered';
  note: string;
}

export interface ValuationInput {
  purpose: ValuationPurpose;
  /** YYYY-MM-DD (UTC), from 2024-01-01 to today; default today. */
  asOf?: string;
  /** A firm sub-account you can read; default your own account. */
  subaccountId?: string;
  /** Printed on the statement (the insured, an estate, a lender), up to 120 characters. Never shown on verify. */
  preparedFor?: string;
  /** Your policy or file reference, up to 80 characters. Never shown on verify. */
  policyRef?: string;
}

export class VaultMarketsValuationResource {
  constructor(private http: HttpClient) {}

  /** The statement for a day, built but not issued (no id, no hash). */
  preview(input: ValuationInput) {
    return this.http.request<ValuationStatement>({
      method: 'GET',
      path: '/v1/vault-markets/valuation-statements/preview',
      query: {
        purpose: input.purpose,
        ...(input.asOf ? { asOf: input.asOf } : {}),
        ...(input.subaccountId ? { subaccountId: input.subaccountId } : {}),
        ...(input.preparedFor ? { preparedFor: input.preparedFor } : {}),
        ...(input.policyRef ? { policyRef: input.policyRef } : {}),
      },
    });
  }

  /** Issue a statement: frozen with its sha256, sealed in the audit chain, with a verify link. */
  issue(input: ValuationInput) {
    return this.http.request<ValuationStatement>({ method: 'POST', path: '/v1/vault-markets/valuation-statements', body: input });
  }

  /** The statements you issued, newest first. */
  list(limit?: number) {
    return this.http.request<ValuationSummaryList>({ method: 'GET', path: '/v1/vault-markets/valuation-statements', query: limit ? { limit } : undefined });
  }

  /** One statement you issued, every unit. */
  get(id: string) {
    return this.http.request<ValuationStatement>({ method: 'GET', path: `/v1/vault-markets/valuation-statements/${encodeURIComponent(id)}` });
  }

  /** Check any issued statement by id (and optionally the hash printed on it): totals and hash only, never the holder. */
  verify(id: string, hash?: string) {
    return this.http.request<ValuationVerify>({ method: 'GET', path: `/v1/vault-markets/valuation-statements/${encodeURIComponent(id)}/verify`, query: hash ? { hash } : undefined });
  }
}
