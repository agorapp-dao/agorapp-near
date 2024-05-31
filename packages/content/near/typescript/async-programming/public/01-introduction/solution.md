```typescript
import { NearBindgen, near, call, view, NearPromise, LookupMap } from 'near-sdk-js';

const GAS = 10_000_000_000_000n;
const DEPOSIT = 1n; // 1 yoctoNEAR

@NearBindgen({})
class AgrTokenFaucet {
  withdrawals = 0;

  @call({})
  withdraw({ amount }: { amount: string }) {
    this.withdrawals++;
    return NearPromise.new('agr-token.test.near').functionCall(
      'ft_transfer',
      JSON.stringify({ receiver_id: near.predecessorAccountId(), amount }),
      DEPOSIT,
      GAS,
    );
  }

  @view({})
  get_withdrawals() {
    return this.withdrawals;
  }
}
```
