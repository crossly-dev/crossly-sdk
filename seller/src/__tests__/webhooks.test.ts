/**
 * Webhook verification.
 *
 * Security code whose failure modes are all silent, so the tests are mostly
 * about the three ways integrators get this wrong in the wild: verifying a
 * re-serialised body, comparing with `===`, and ignoring the timestamp.
 */
import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyWebhook, WebhookVerificationError } from '../webhooks.js';

const SECRET = 'whsec_test_value';

function sign(body: string, t: number, secret = SECRET): string {
  const sig = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
  return `t=${t},v1=${sig}`;
}

const NOW = 1_700_000_000;
const EVENT = {
  id: 'evt_1',
  type: 'listing.sold',
  created: '2026-01-01T00:00:00.000Z',
  data: { listingId: 'abc', priceCents: 4599 },
};
const BODY = JSON.stringify(EVENT);

describe('a genuine webhook', () => {
  it('verifies and returns the parsed event', async () => {
    const event = await verifyWebhook(BODY, sign(BODY, NOW), SECRET, { nowSeconds: NOW });
    expect(event.type).toBe('listing.sold');
    expect((event.data as { priceCents: number }).priceCents).toBe(4599);
  });

  it('accepts a Buffer as well as a string', async () => {
    const event = await verifyWebhook(Buffer.from(BODY, 'utf8'), sign(BODY, NOW), SECRET, {
      nowSeconds: NOW,
    });
    expect(event.id).toBe('evt_1');
  });

  it('tolerates an extra signature version in the header', async () => {
    // The scheme is versioned so a future v2 can ship alongside v1. A verifier
    // that broke on an unknown field would make that a breaking change.
    const header = `${sign(BODY, NOW)},v2=somethingelse`;
    await expect(verifyWebhook(BODY, header, SECRET, { nowSeconds: NOW })).resolves.toBeTruthy();
  });
});

describe('forgery and tampering', () => {
  it('rejects a body that was changed after signing', async () => {
    const tampered = JSON.stringify({ ...EVENT, data: { listingId: 'abc', priceCents: 1 } });
    await expect(verifyWebhook(tampered, sign(BODY, NOW), SECRET, { nowSeconds: NOW })).rejects.toThrow(
      WebhookVerificationError,
    );
  });

  it('rejects a signature made with a different secret', async () => {
    const header = sign(BODY, NOW, 'whsec_someone_elses');
    try {
      await verifyWebhook(BODY, header, SECRET, { nowSeconds: NOW });
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as WebhookVerificationError).reason).toBe('bad_signature');
    }
  });

  it('rejects a timestamp edited to look fresh', async () => {
    // The timestamp is INSIDE the signed message, so moving it invalidates the
    // signature. This is the test that proves the replay guard cannot simply
    // be edited around.
    const real = sign(BODY, NOW - 10_000);
    const moved = real.replace(`t=${NOW - 10_000}`, `t=${NOW}`);
    try {
      await verifyWebhook(BODY, moved, SECRET, { nowSeconds: NOW });
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as WebhookVerificationError).reason).toBe('bad_signature');
    }
  });
});

describe('replay', () => {
  it('rejects an old but genuinely signed delivery', async () => {
    try {
      await verifyWebhook(BODY, sign(BODY, NOW - 3600), SECRET, { nowSeconds: NOW });
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as WebhookVerificationError).reason).toBe('timestamp_out_of_tolerance');
    }
  });

  it('rejects one from the future too', async () => {
    // A far-future timestamp is either a broken clock or someone extending
    // their own replay window.
    await expect(
      verifyWebhook(BODY, sign(BODY, NOW + 3600), SECRET, { nowSeconds: NOW }),
    ).rejects.toThrow(WebhookVerificationError);
  });

  it('allows a delivery inside the tolerance', async () => {
    // Retries sit in queues and other people's clocks drift; rejecting a
    // two-minute-old redelivery would drop genuine traffic.
    await expect(
      verifyWebhook(BODY, sign(BODY, NOW - 120), SECRET, { nowSeconds: NOW }),
    ).resolves.toBeTruthy();
  });

  it('honours a custom tolerance', async () => {
    await expect(
      verifyWebhook(BODY, sign(BODY, NOW - 30), SECRET, { nowSeconds: NOW, toleranceSeconds: 10 }),
    ).rejects.toThrow(WebhookVerificationError);
  });
});

describe('malformed input', () => {
  it.each([
    [undefined, 'no header at all'],
    [null, 'a null header'],
    ['', 'an empty header'],
    ['garbage', 'no key=value pairs'],
    ['v1=abc', 'no timestamp'],
    ['t=1700000000', 'no signature'],
    ['t=notanumber,v1=abc', 'a non-numeric timestamp'],
  ])('rejects %j — %s', async (header) => {
    await expect(verifyWebhook(BODY, header as string, SECRET, { nowSeconds: NOW })).rejects.toThrow(
      WebhookVerificationError,
    );
  });

  it('refuses to run without a secret', async () => {
    // Would otherwise "verify" against an empty-key HMAC, which is a
    // deterministic value an attacker can compute.
    try {
      await verifyWebhook(BODY, sign(BODY, NOW), '', { nowSeconds: NOW });
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as WebhookVerificationError).reason).toBe('missing_secret');
    }
  });
});

describe('the re-serialisation trap', () => {
  it('fails on a round-tripped body, and says so', async () => {
    // THE mistake. `JSON.parse` then `JSON.stringify` does not round-trip byte
    // for byte — key order and number formatting both drift — so genuine
    // payloads fail and the usual "fix" is to stop verifying. The error
    // message has to name this, because nothing else about it is obvious.
    const reordered = JSON.stringify({
      data: EVENT.data,
      created: EVENT.created,
      type: EVENT.type,
      id: EVENT.id,
    });
    expect(reordered).not.toBe(BODY);

    try {
      await verifyWebhook(reordered, sign(BODY, NOW), SECRET, { nowSeconds: NOW });
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as WebhookVerificationError).reason).toBe('bad_signature');
      expect((e as Error).message).toMatch(/raw bytes/i);
    }
  });
});

describe('it throws rather than returning false', () => {
  it('never returns a falsy value a caller could forget to check', async () => {
    // A boolean API invites `if (verify(...))` being written as
    // `verify(...)` — and that mistake accepts every forged event.
    const result = await verifyWebhook(BODY, sign(BODY, NOW), SECRET, { nowSeconds: NOW });
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });
});
