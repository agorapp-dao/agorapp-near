## NEARTrade

NEARTrade is a fictional trading platform similar to Coinbase or Binance. Users can deposit NEAR tokens into the platform and trade them for other tokens.

The platform is governed by a smart contract deployed at `near-trade.near`. The source code for the contract is available in the `near-trade.ts` file.

One nice feature of NEARTrade is that it automatically stakes your tokens with a third-party staking pool. This way, you can earn staking rewards from the tokens you did not use for trading.

Take a look at the `near_deposit` function:

```typescript
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
```

When users deposits NEAR tokens into the contract, they are immediately transferred to the staking pool.

Later on, when user wants to withdraw their tokens, the contract calls the staking pool to withdraw the tokens back and send them to the user:

```typescript
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
```

## Exercise

The contract has a serious security vulnerability that could allow an attacker to steal the other user's funds locked in the contract.

Find the vulnerability and implement the exploit in the `attack.ts` smart contract. If you are able to get the tokens that are not yours, you win.

To explore and test your solution, you can utilize the **Transactions** panel located at the bottom. This tool allows you to interact with the contract by experimenting with various inputs and method calls.

Once you have the solution, submit it by clicking the **Submit** button.
