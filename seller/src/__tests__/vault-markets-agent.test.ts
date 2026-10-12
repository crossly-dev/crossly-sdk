/**
 * VaultMarketsAgentResource: the shopping agent's price watches and drafted
 * orders on /v1/vault-markets/agent, under `client.vaultMarkets.agent`. A
 * draft is placed only with vaultMarkets.pro.placeOrder and its orderBody:
 * this resource has no confirm.
 */
import { describe, expect, it, vi } from 'vitest';
import { createClient } from '../index.js';
import { VaultMarketsAgentResource } from '../resources/vault-markets-agent.js';
import type { HttpClient } from '../client.js';

const ID = '33333333-3333-4333-8333-333333333333';

function resource() {
  const calls: Array<Record<string, unknown>> = [];
  const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
  return { r: new VaultMarketsAgentResource(http), calls };
}

describe('VaultMarketsAgentResource', () => {
  it('watches', async () => {
    const { r, calls } = resource();
    await r.watches({ live: true });
    await r.createWatch({ bookKey: 'v:near_mint:psa:10', metric: 'bid', thresholdCents: 40_000 });
    await r.cancelWatch(ID);
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/v1/vault-markets/agent/watches', query: { live: 'true' } });
    expect(calls[1]).toMatchObject({ method: 'POST', path: '/v1/vault-markets/agent/watches', body: { metric: 'bid', thresholdCents: 40_000 } });
    expect(calls[2]).toMatchObject({ method: 'DELETE', path: `/v1/vault-markets/agent/watches/${ID}` });
  });

  it('drafts', async () => {
    const { r, calls } = resource();
    await r.drafts();
    await r.draft(ID);
    await r.cancelDraft(ID);
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault-markets/agent/drafts',
      `GET /v1/vault-markets/agent/drafts/${ID}`,
      `POST /v1/vault-markets/agent/drafts/${ID}/cancel`,
    ]);
  });

  it('has no way to confirm or place a draft', () => {
    const verbs = Object.getOwnPropertyNames(VaultMarketsAgentResource.prototype).filter((n) => n !== 'constructor');
    expect(verbs).toEqual(['watches', 'createWatch', 'cancelWatch', 'drafts', 'draft', 'cancelDraft']);
  });

  it('is on the client under vaultMarkets.agent', () => {
    const vm = createClient({ pat: 'crossly_pat_test' }).vaultMarkets as unknown as { agent?: unknown };
    expect(vm.agent).toBeInstanceOf(VaultMarketsAgentResource);
  });
});
