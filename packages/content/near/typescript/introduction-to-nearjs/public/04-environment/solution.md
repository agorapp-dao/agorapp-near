```typescript
import { NearBindgen, view, call, LookupMap, near } from 'near-sdk-js';

@NearBindgen({})
class Counter {
  counters = new LookupMap<number>('counters');

  @view({})
  get_count({ accountId }: { accountId: string }): number {
    return this.counters.get(accountId) || 0;
  }

  @call({})
  increment() {
    const accountId = near.signerAccountId();
    let count = this.get_count({ accountId });
    count++;
    this.counters.set(accountId, count);
  }
}
```
