import { NearBindgen, call, NearPromise } from 'near-sdk-js';

const CALL_GAS = 5_000_000_000n;

@NearBindgen({})
class NftGiveaway {
  @call({})
  claim_free_nft() {
    // You know that Alice has deposited NEAR tokens in the tip-stream contract. You
    // also know that Alice will call this method. Can you steal her funds locked in
    // the tip-stream contract?
  }
}
