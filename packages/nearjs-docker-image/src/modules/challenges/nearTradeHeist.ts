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
import { TRunActionRequest, TRunActionResponse } from '../../types';
import {
  CODE_INVALID_SEQUENTIAL,
  CODE_NEAR_TRADE,
  CODE_STAKING_POOL,
  CODE_VALID1,
  CODE_VALID2,
} from './nearTradeHeist.code';

@Course('near-trade-heist')
export class NearTradeHeistChallenge extends CourseBase {
  lessons = [AttackLesson];
}

@Lesson('challenge')
@Passes('ok1', CODE_VALID1)
// TODO: fix test-case
// @Passes('ok2', CODE_VALID2)
@Fails('seq', CODE_INVALID_SEQUENTIAL, 'Not enough balance')
class AttackLesson extends LessonBase {
  @Test(`Should steal other users's tokens from the NEARTrade`)
  async test1() {
    const near = new NearSdkMock();
    near.addAccount('attack.near', 5_000_000n);
    near.addAccount('near-trade.near', 1_000_000_000_000n);
    near.addAccount('staking-pool.near', 1_200_000_000_000n);

    await near.deploy('attack.near', this.files['attack.ts'].content);
    await near.deploy('near-trade.near', CODE_NEAR_TRADE);
    await near.deploy('staking-pool.near', CODE_STAKING_POOL);

    await near.call('attack.near', 'attack.near', 'attack', {}, {});

    if (near.getBalance('attack.near') <= 5_000_000n) {
      expect.fail(
        `attack.near balance should contain more tokens than the initial amount. You didn't steal anything.`,
      );
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

    await near.deploy('attack.near', this.files['attack.ts'].content);
    await near.deploy('near-trade.near', CODE_NEAR_TRADE);
    await near.deploy('staking-pool.near', CODE_STAKING_POOL);

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
