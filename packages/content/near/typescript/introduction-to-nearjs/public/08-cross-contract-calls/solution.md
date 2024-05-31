**game-manager.ts**

```typescript
import { NearBindgen, call, near, NearPromise } from 'near-sdk-js';

const GAS = 50_000_000_000_000n;

@NearBindgen({})
class GameManager {
  @call({})
  execute({ gameAccountId }: { gameAccountId: string }) {
    return NearPromise.new(gameAccountId).functionCall('play', '', 0n, GAS);
  }
}
```

**game.ts**

Add the following check to the `play` method. Note that we are using the `predecessorAccountId` method, not `signerAccountId`.

```typescript
if (near.predecessorAccountId() !== 'game-manager.near') {
  throw new Error('Unauthorized');
}
```
