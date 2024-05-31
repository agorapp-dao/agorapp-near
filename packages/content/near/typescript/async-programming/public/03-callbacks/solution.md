```typescript
import { NearBindgen, near, call, view, NearPromise } from 'near-sdk-js';

const GAS = 10_000_000_000_000n;
const DEPOSIT = 1n; // 1 yoctoNEAR

@NearBindgen({})
class AgrTokenFaucet {
  withdrawals = 0;

  @call({})
  withdraw({ amount }: { amount: string }) {
    return NearPromise.new('agr-token.test.near')
      .functionCall(
        'ft_transfer',
        JSON.stringify({ receiver_id: near.predecessorAccountId(), amount }),
        DEPOSIT,
        GAS,
      )
      .then(
        NearPromise.new(near.currentAccountId()).functionCall(
          'ft_transfer_callback',
          '',
          undefined,
          GAS,
        ),
      );
  }

  @call({ privateFunction: true })
  ft_transfer_callback() {
    // promiseResult will throw if promise with index 0 failed
    near.promiseResult(0);
    this.withdrawals++;
  }

  @view({})
  get_withdrawals() {
    return this.withdrawals;
  }
}
```
