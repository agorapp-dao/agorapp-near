import { NearBindgen, LookupMap, call, NearPromise, near } from 'near-sdk-js';

const GAS = 10_000_000_000_000n;
const NO_DEPOSIT = 0n;

@NearBindgen({})
class NEARTrade {
  balances = new LookupMap<bigint>('balances');

  // Most of the methods are omitted for brevity. The only thing you can do is deposit and withdraw NEAR tokens.

  @call({ payableFunction: true })
  near_deposit() {
    const balance = this.balances.get(near.predecessorAccountId()) ?? 0n;
    this.balances.set(near.predecessorAccountId(), balance + near.attachedDeposit());
    return NearPromise.new('staking-pool.near').functionCall(
      'deposit',
      '',
      near.attachedDeposit(),
      GAS,
    );
  }

  @call({})
  near_withdraw({ amount }: { amount: string }) {
    const recipient = near.predecessorAccountId();
    const balance = this.balances.get(recipient) ?? 0n;
    const amountInt = BigInt(amount);

    near.log(`Going to withdraw ${amountInt} from ${balance}`);
    if (amountInt > balance) {
      throw new Error('Not enough balance');
    }

    return NearPromise.new('staking-pool.near')
      .functionCall('withdraw', JSON.stringify({ amount: amountInt.toString() }), NO_DEPOSIT, GAS)
      .then(
        NearPromise.new(near.currentAccountId()).functionCall(
          'withdraw_callback',
          JSON.stringify({ accountId: recipient, amount: amountInt.toString() }),
          NO_DEPOSIT,
          GAS,
        ),
      );
  }

  @call({ privateFunction: true })
  withdraw_callback({ accountId, amount }: { accountId: string; amount: string }) {
    const amountInt = BigInt(amount);

    const balance = this.balances.get(accountId) ?? 0n;
    near.log(`Updating balance for ${accountId} from ${balance} to ${balance - amountInt}`);
    this.balances.set(accountId, balance - amountInt);
    return NearPromise.new(accountId).transfer(amountInt);
  }
}
