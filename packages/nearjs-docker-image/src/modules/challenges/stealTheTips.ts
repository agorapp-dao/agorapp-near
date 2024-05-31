import {
  Action,
  Course,
  CourseBase,
  expect,
  Fails,
  Lesson,
  LessonBase,
  Passes,
  Test,
} from '@agorapp-dao/runner-common';
import { NearSdkMock } from '@agorapp-dao/nearjs-mock';
import { TActionRequest } from '@agorapp-dao/runner-common/src/types';
import { TNearArg, TRunActionRequest, TRunActionResponse } from '../../types';
import { CODE_INVALID1, CODE_INVALID2, CODE_VALID } from './stealTheTips.code';

@Course('steal-the-tips')
export class StealTheTipsChallenge extends CourseBase {
  lessons = [AttackLesson];
}

@Lesson('challenge')
@Passes('ok', CODE_VALID)
@Fails('invalid1', CODE_INVALID1, `The attacker account should have all the Alice's tokens`)
@Fails(
  'invalid2',
  CODE_INVALID2,
  `Almost there! The tokens are in the contract you control. Now transfer them to the attacker account.`,
)
class AttackLesson extends LessonBase {
  @Test(`Should steal Alice's tokens`)
  async test1() {
    const near = new NearSdkMock();
    near.addAccount('alice.near', 1_000_000_000n);
    near.addAccount('attacker.near', 0n);
    await near.deploy('tip-stream.near', CODE_VALID['tip-stream.ts'].content);
    await near.deploy('nft-giveaway.near', this.files['nft-giveaway.ts'].content);

    await near.call(
      'tip-stream.near',
      'alice.near',
      'near_deposit',
      {},
      { attachedDeposit: 1_000_000_000n },
    );
    await near.call('nft-giveaway.near', 'alice.near', 'claim_free_nft', {});

    if (near.getBalance('nft-giveaway.near') === 1_000_000_000n) {
      expect.fail(
        'Almost there! The tokens are in the contract you control. Now transfer them to the attacker account.',
      );
    } else if (near.getBalance('attacker.near') !== 1_000_000_000n) {
      expect.fail(`The attacker account should have all the Alice's tokens.`);
    }
  }

  @Action('run')
  async run(request: TActionRequest<TRunActionRequest>): Promise<TRunActionResponse> {
    const near = new NearSdkMock();

    const { args } = request;
    const { accounts, transactions } = args;

    for (const account of accounts) {
      console.debug('Adding account', account.accountId, account.balance);
      near.addAccount(account.accountId, BigInt(account.balance));
    }

    await near.deploy('tip-stream.near', CODE_VALID['tip-stream.ts'].content);
    await near.deploy('nft-giveaway.near', this.files['nft-giveaway.ts'].content);

    for (const transaction of transactions) {
      const args: any = {};
      for (const arg of transaction.args) {
        let value;
        switch (arg.type) {
          case 'bigint':
            value = BigInt(arg.value);
            break;
          default:
            value = arg.value;
        }
        args[arg.name] = value;
      }

      await near.call(
        transaction.contract,
        transaction.signer,
        transaction.method,
        args,
        transaction.amount ? { attachedDeposit: BigInt(transaction.amount) } : null,
      );
    }

    for (const account of accounts) {
      account.balance = near.getBalance(account.accountId).toString();
    }

    return { accounts };
  }
}
