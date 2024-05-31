import chai, { expect } from 'chai';
import { TActionRequest, TActionResponse } from '@agorapp-dao/runner-common/src/types';
import { toFilesArray } from '@agorapp-dao/runner-common';
import { TRunActionRequest, TRunActionResponse } from '../../types';
import { CODE_VALID } from './stealTheTips.code';
import { runner } from '../modules';

chai.config.truncateThreshold = 0;

describe('stealTheTips actions', () => {
  it('steal the funds', async () => {
    const req: TActionRequest<TRunActionRequest> = {
      runner: 'test',
      action: 'run',
      courseSlug: 'steal-the-tips',
      lessonSlug: 'challenge',
      files: toFilesArray(CODE_VALID),
      args: {
        accounts: [
          { accountId: 'alice.near', balance: 1_000_000_000n.toString() },
          { accountId: 'attacker.near', balance: 0n.toString() },
          { accountId: 'tip-stream.near', balance: 800_000_000_000n.toString() },
          { accountId: 'nft-giveaway.near', balance: 0n.toString() },
        ],
        transactions: [
          {
            contract: 'tip-stream.near',
            method: 'near_deposit',
            signer: 'alice.near',
            args: [],
            amount: 1_000_000_000n.toString(),
          },
          {
            contract: 'nft-giveaway.near',
            method: 'claim_free_nft',
            signer: 'alice.near',
            args: [],
          },
        ],
      },
    };

    const res = await runner.action<TRunActionResponse>(req);

    expect(res.body.accounts).to.deep.equal([
      {
        accountId: 'alice.near',
        balance: '0',
      },
      {
        accountId: 'attacker.near',
        balance: '1000000000',
      },
      {
        accountId: 'tip-stream.near',
        balance: '800000000000',
      },
      {
        accountId: 'nft-giveaway.near',
        balance: '0',
      },
    ]);
  });
});
