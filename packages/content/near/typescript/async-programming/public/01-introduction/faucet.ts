import { NearBindgen, near, call, view, NearPromise, LookupMap } from 'near-sdk-js';

const GAS = 10_000_000_000_000n;
const DEPOSIT = 1n; // 1 yoctoNEAR

@NearBindgen({})
class AgrTokenFaucet {
  withdrawals = 0;

  @call({})
  withdraw({ amount }: { amount: string }) {
    // your code here
  }

  @view({})
  get_withdrawals() {
    return this.withdrawals;
  }
}
