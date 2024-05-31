import { NearBindgen, near, call, view, NearPromise } from 'near-sdk-js';

const GAS = 10_000_000_000_000n;
const DEPOSIT = 1n; // 1 yoctoNEAR

@NearBindgen({})
class AgrTokenFaucet {
  @call({})
  payout({ receivers }: { receivers: string[] }) {
    if (receivers.length === 0) {
      throw new Error('No receivers provided');
    }

    let promise = NearPromise.new('agr-token.test.near').functionCall(
      'ft_transfer',
      JSON.stringify({ receiver_id: receivers[0], amount: '100' }),
      DEPOSIT,
      GAS,
    );

    for (let i = 1; i < receivers.length; i++) {
      promise.and(
        NearPromise.new('agr-token.test.near').functionCall(
          'ft_transfer',
          JSON.stringify({ receiver_id: receivers[i], amount: '100' }),
          DEPOSIT,
          GAS,
        ),
      );
    }

    promise.then(
      NearPromise.new(near.currentAccountId()).functionCall(
        'ft_transfer_callback',
        '',
        undefined,
        GAS,
      ),
    );

    return promise;
  }

  @call({ privateFunction: true })
  ft_transfer_callback() {
    // do nothing
  }
}
