import { NearBindgen, near, call, LookupMap, NearPromise } from 'near-sdk-js';

@NearBindgen({})
class TipStream {
  balances = new LookupMap<bigint>('balances');

  @call({ payableFunction: true })
  near_deposit() {
    const accountId = near.predecessorAccountId();
    const balance = this.balances.get(accountId) ?? 0n;
    this.balances.set(accountId, balance + near.attachedDeposit());
  }

  @call({})
  tip({ receiverAccountId, amount }: { receiverAccountId: string; amount: string }) {
    const senderAccountId = near.signerAccountId();
    const senderBalance = this.balances.get(senderAccountId) ?? 0n;
    const amountInt = BigInt(amount);
    if (amountInt > senderBalance) {
      throw new Error('Not enough balance to transfer');
    }

    const receiverBalance = this.balances.get(receiverAccountId) ?? 0n;
    this.balances.set(senderAccountId, senderBalance - amountInt);
    this.balances.set(receiverAccountId, receiverBalance + amountInt);
  }

  @call({})
  near_withdraw({ amount }: { amount: string }) {
    const accountId = near.predecessorAccountId();
    const amountInt = BigInt(amount);
    const balance = this.balances.get(accountId) ?? 0n;
    if (amountInt > balance) {
      throw new Error('Not enough balance to withdraw');
    }

    this.balances.set(accountId, balance - BigInt(amountInt));
    return NearPromise.new(accountId).transfer(BigInt(amountInt));
  }
}
