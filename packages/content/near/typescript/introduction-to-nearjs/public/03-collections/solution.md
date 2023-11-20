```typescript
import { NearBindgen, view, call, LookupMap } from 'near-sdk-js';

@NearBindgen({})
class Counter {
  counters = new LookupMap<number>('counters');

  @view({})
  get_count({ key }: { key: string }): number {
    return this.counters.get(key) || 0;
  }

  @call({})
  increment({ key }: { key: string }) {
    let count = this.get_count({ key });
    count++;
    this.counters.set(key, count);
  }
}
```
