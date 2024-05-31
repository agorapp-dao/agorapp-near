import { NearBindgen, call, NearPromise, near } from 'near-sdk-js';

const GAS = 50_000_000_000_000n;
const NO_DEPOSIT = 0n;

@NearBindgen({})
class Attack {
  @call({})
  attack() {
    // your code here
  }
}
