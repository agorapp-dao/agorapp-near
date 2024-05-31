```typescript
import { NearBindgen, call, near } from 'near-sdk-js';

@NearBindgen({})
class Game {
  @call({ payableFunction: true })
  join() {
    if (near.attachedDeposit() !== 1_000_000n) {
      throw new Error('Join fee is 1,000,000 yoctoNEAR');
    }
  }
}
```
