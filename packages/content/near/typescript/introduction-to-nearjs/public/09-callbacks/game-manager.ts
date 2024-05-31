import { NearBindgen, call, near, NearPromise } from 'near-sdk-js';

const GAS = 50_000_000_000_000n;

@NearBindgen({})
class GameManager {
  @call({})
  execute({ gameAccountId }: { gameAccountId: string }) {
    return NearPromise.new(gameAccountId).functionCall('play', '', 0n, GAS);
  }
}
