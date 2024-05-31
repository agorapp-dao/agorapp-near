```typescript
import * as crypto from 'crypto';
import { NearBindgen, call, near, NearPromise, includeBytes } from 'near-sdk-js';

const GAS = 50_000_000_000_000n;
const GAME_CODE = includeBytes('./game.wasm');

@NearBindgen({})
class GameManager {
  gamesPlayed = 0;

  @call({})
  start() {
    const gameAccountId = crypto.randomUUID();

    return NearPromise.new(`${gameAccountId}.game.near`)
      .createAccount()
      .transfer(5n * BigInt(Math.pow(10, 24)))
      .deployContract(GAME_CODE);
  }

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
