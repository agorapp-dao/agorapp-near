```typescript
import { NearBindgen, near, call, view, LookupMap, NearPromise } from 'near-sdk-js';

const GAS = 10_000_000_000_000n;
const DEPOSIT = 1n; // 1 yoctoNEAR

@NearBindgen({})
class TokenSwap {
  balances = new LookupMap<bigint>('balances');

  @call({})
  ft_on_transfer({ sender_id, amount, msg }: { sender_id: string; amount: string; msg: string }) {
    const tokenId = near.predecessorAccountId();
    const key = `${tokenId}:${sender_id}`;
    this.balances.set(key, this.balances.get(key) ?? 0n + BigInt(amount));
  }

  @call({})
  swap({ amount }: { amount: string }) {
    const amountInt = BigInt(amount);

    const aliceAbc = this.balances.get('abc-token.test.near:alice.test.near') ?? 0n;
    const aliceXyz = this.balances.get('xyz-token.test.near:alice.test.near') ?? 0n;
    const bobAbc = this.balances.get('abc-token.test.near:bob.test.near') ?? 0n;
    const bobXyz = this.balances.get('xyz-token.test.near:bob.test.near') ?? 0n;

    if (aliceAbc < amountInt) {
      throw new Error(`Alice does not have enough ABC tokens to perform the swap`);
    }
    if (bobXyz < amountInt) {
      throw new Error(`Bob does not have enough XYZ tokens to perform the swap`);
    }

    this.balances.set('abc-token.test.near:alice.test.near', aliceAbc - amountInt);
    this.balances.set('abc-token.test.near:bob.test.near', bobAbc + amountInt);

    this.balances.set('xyz-token.test.near:alice.test.near', aliceXyz + amountInt);
    this.balances.set('xyz-token.test.near:bob.test.near', bobXyz - amountInt);
  }

  @call({})
  ft_withdraw({ token_id, amount }: { token_id: string; amount: string }) {
    const amountInt = BigInt(amount);
    const balance = this.balances.get(`${token_id}:${near.predecessorAccountId()}`);

    if (amountInt > balance) {
      throw new Error(`${near.predecessorAccountId()} does not have enough balance of ${token_id}`);
    }

    this.balances.set(`${token_id}:${near.predecessorAccountId()}`, balance - amountInt);

    return NearPromise.new(token_id)
      .functionCall(
        'ft_transfer',
        JSON.stringify({ receiver_id: near.predecessorAccountId(), amount: amount }),
        DEPOSIT,
        GAS,
      )
      .then(
        NearPromise.new(near.currentAccountId()).functionCall('ft_transfer_callback', '', 0n, GAS),
      );
  }

  @call({ privateFunction: true })
  ft_transfer_callback({
    token_id,
    receiver_id,
    amount,
  }: {
    token_id: string;
    receiver_id: string;
    amount: string;
  }) {
    let success = true;
    try {
      near.promiseResult(0);
    } catch (err) {
      success = false;
    }

    if (!success) {
      // rollback balance change
      const amountInt = BigInt(amount);
      const balance = this.balances.get(`${token_id}:${receiver_id}`) ?? 0n;
      this.balances.set(`${token_id}:${receiver_id}`, balance + amountInt);
    }
  }
}
```
