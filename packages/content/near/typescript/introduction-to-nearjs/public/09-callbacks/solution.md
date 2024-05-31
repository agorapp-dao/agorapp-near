```typescript
import { NearBindgen, call, near, NearPromise } from 'near-sdk-js';

const GAS = 50_000_000_000_000n;

@NearBindgen({})
class GameManager {
  gamesPlayed = 0;

  @call({})
  execute({ gameAccountId }: { gameAccountId: string }) {
    return NearPromise.new(gameAccountId)
      .functionCall('play', '', 0n, GAS)
      .then(NearPromise.new(near.currentAccountId()).functionCall('play_callback', '', 0n, GAS));
  }

  @call({ privateFunction: true })
  play_callback() {
    this.gamesPlayed++;
  }
}
```
