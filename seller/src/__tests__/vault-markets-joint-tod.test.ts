/**
 * VaultMarketsJointTodResource hits its literal v1 paths, ids encoded, bodies as the api reads them.
 */
import { describe, expect, it, vi } from 'vitest';
import { VaultMarketsJointTodResource } from '../resources/vault-markets-joint-tod.js';
import type { HttpClient } from '../client.js';

describe('VaultMarketsJointTodResource', () => {
  it('maps every call to its route', async () => {
    const calls: Array<{ method: string; path: string; body?: unknown; query?: unknown }> = [];
    const http = { request: vi.fn(async (opts) => { calls.push(opts); return {} as unknown; }) } as unknown as HttpClient;
    const r = new VaultMarketsJointTodResource(http);
    await r.joint();
    await r.createJoint({ name: 'Family', invite: [{ to: '@kid', rights: 'trade' }] });
    await r.getJoint('j/1');
    await r.invite('j1', 'a@b.com', 'full');
    await r.respond('j1', 'accept');
    await r.acceptJointTerms('j1');
    await r.setRights('j1', 'u1', 'view');
    await r.removeMember('j1', 'u1');
    await r.addUnits('j1', ['v1']);
    await r.removeUnits('j1', ['v1']);
    await r.trades('j1', 10);
    await r.trade('j1', { side: 'sell', vaultItemId: 'v1', limitCents: 5_000 });
    await r.cancelTrade('j1', 't 1');
    await r.close('j1');
    await r.tod();
    await r.acceptTodTerms();
    await r.setBeneficiaries([{ fullName: 'Kid', contact: 'kid@x.com', shareBps: 10_000 }]);
    await r.designate('v1', null);
    await r.objectToClaim('c1');
    await r.myClaims();
    await r.fileClaim({ holder: '@mum' });
    await r.addClaimDocument('c1', { kind: 'death_certificate', filename: 'c.pdf', dataBase64: 'JVBERi0=' });
    await r.submitClaim('c1');
    await r.withdrawClaim('c1');
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /v1/vault-markets/joint',
      'POST /v1/vault-markets/joint',
      'GET /v1/vault-markets/joint/j%2F1',
      'POST /v1/vault-markets/joint/j1/invite',
      'POST /v1/vault-markets/joint/j1/respond',
      'POST /v1/vault-markets/joint/j1/terms',
      'POST /v1/vault-markets/joint/j1/members/u1/rights',
      'POST /v1/vault-markets/joint/j1/members/u1/remove',
      'POST /v1/vault-markets/joint/j1/units',
      'POST /v1/vault-markets/joint/j1/units/remove',
      'GET /v1/vault-markets/joint/j1/trades',
      'POST /v1/vault-markets/joint/j1/trades',
      'POST /v1/vault-markets/joint/j1/trades/t%201/cancel',
      'POST /v1/vault-markets/joint/j1/close',
      'GET /v1/vault-markets/tod',
      'POST /v1/vault-markets/tod/terms',
      'PUT /v1/vault-markets/tod/beneficiaries',
      'PUT /v1/vault-markets/tod/designations',
      'POST /v1/vault-markets/tod/claims/c1/object',
      'GET /v1/vault-markets/tod/my-claims',
      'POST /v1/vault-markets/tod/my-claims',
      'POST /v1/vault-markets/tod/my-claims/c1/documents',
      'POST /v1/vault-markets/tod/my-claims/c1/submit',
      'POST /v1/vault-markets/tod/my-claims/c1/withdraw',
    ]);
    expect(calls[3]!.body).toEqual({ to: 'a@b.com', rights: 'full' });
    expect(calls[10]!.query).toEqual({ limit: 10 });
    expect(calls[17]!.body).toEqual({ vaultItemId: 'v1', beneficiaryId: null });
  });
});
