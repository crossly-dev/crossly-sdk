import type { HttpClient, IdempotencyOpts } from '../_shared.js';

/**
 * Gift cards — buy one for somebody, redeem one into your own balance.
 *
 * Needs a BUYER token: `buyer:giftcards:read` for the two reads,
 * `buyer:giftcards:write` for purchase and redeem.
 *
 * `purchase` does NOT charge anything. It returns a Stripe PaymentIntent
 * `clientSecret` that the person confirms with a payment method (Stripe.js
 * or a mobile PaymentSheet). The card becomes real only when Stripe reports
 * the payment, and its code is emailed to the recipient — it is never in an
 * API response. Pass an idempotency key derived from the intent (e.g.
 * `gift:<recipient>:<occasion>`); the API refuses the call without one.
 *
 * Cards, and the credit a redeemed card becomes, expire five years after
 * purchase.
 */

export interface PurchasedGiftCard {
  id: string;
  amountCents: number;
  recipientEmail: string;
  recipientName: string | null;
  message: string | null;
  status: 'active' | 'redeemed' | 'void' | 'expired' | string;
  deliverAt: string;
  deliveredAt: string | null;
  expiresAt: string;
  redeemed: boolean;
  createdAt: string;
  /** Masked (`CRX-••••-••••-ABCD`) unless you sent the card to yourself. */
  code: string;
}

export interface GiftCredit {
  id: string;
  amountCents: number;
  /** 'bucks' | 'cbx' — where the value landed. */
  rail: string | null;
  remainingCents: number | null;
  remainingBaseUnits: string | null;
  redeemedAt: string;
  expiresAt: string;
  expired: boolean;
}

export interface GiftCardPurchase {
  giftCardId: string;
  paymentIntentId: string;
  clientSecret: string;
  amountCents: number;
  currency: string;
  status: string;
  deliverAt: string;
  expiresAt: string;
}

export interface GiftCardRedemption {
  giftCardId: string;
  amountCents: number;
  rail: 'bucks' | 'cbx';
  /** Token quantity when the rail is cbx, as a decimal string. */
  baseUnits: string | null;
  expiresAt: string;
}

export class BuyerGiftCardsResource {
  constructor(private http: HttpClient) {}

  /** Cards you bought, newest first. Requires `buyer:giftcards:read`. */
  list() {
    return this.http.request<{ data: PurchasedGiftCard[] }>({
      method: 'GET',
      path: '/v1/buyer/gift-cards',
    });
  }

  /**
   * Gift card credit you redeemed and what is left of it.
   * `meta.giftCreditCents` / `meta.nextExpiresAt` summarise.
   * Requires `buyer:giftcards:read`.
   */
  credit() {
    return this.http.request<{
      data: GiftCredit[];
      meta?: { giftCreditCents: number; nextExpiresAt: string | null };
    }>({ method: 'GET', path: '/v1/buyer/gift-cards/credit' });
  }

  /**
   * Open a purchase ($10–$500). Returns a PaymentIntent client secret to
   * confirm; charges nothing by itself. Requires `buyer:giftcards:write`
   * and an idempotency key.
   */
  purchase(
    input: {
      amountCents: number;
      recipientEmail: string;
      recipientName?: string;
      message?: string;
      /** ISO instant to email the code; omit for as soon as it is paid. */
      deliverAt?: string;
    },
    opts: IdempotencyOpts,
  ) {
    return this.http.request<{ data: GiftCardPurchase }>({
      method: 'POST',
      path: '/v1/buyer/gift-cards',
      body: input,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  /** Redeem a code into your own balance. Requires `buyer:giftcards:write`. */
  redeem(code: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: GiftCardRedemption }>({
      method: 'POST',
      path: '/v1/buyer/gift-cards/redeem',
      body: { code },
      idempotencyKey: opts.idempotencyKey,
    });
  }
}
