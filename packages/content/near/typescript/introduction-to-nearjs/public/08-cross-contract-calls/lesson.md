So far, we have been working with a single smart contract. In this lesson, we will explore how one contract can interact with another on the NEAR blockchain.

Any contract can call a method on another contract by using the `NearPromise.functionCall()`:

```typescript
// maximum gas we are willing to pay for the function call
const GAS = 50_000_000_000_000n;
const NO_DEPOSIT = 0n;

@NearBindgen({})
class MyPortfolioContract {
  @call({})
  rebalance_portfolio() {
    // ... rebalance logic ommited for brevity

    return NearPromise.new('trading-platform.near').functionCall(
      'buy_token',
      JSON.stringify({ token: 'XYZ', amount: 3_000 }),
      NO_DEPOSIT,
      GAS,
    );
  }
}
```

In the example above, `MyPortfolioContract` manages a user's investment portfolio automatically. When the portfolio needs rebalancing, the contract calls a method on the `trading-platform.near` contract to buy or sell tokens.

Here are a few key points to notice in the example:

- We use `NearPromise.new()` with the account ID of the contract on which we want to invoke the method.
- Input parameters are passed as a string containing JSON.
- We must specify the maximum amount of gas we are willing to pay for the function call (`GAS`).
- We are not attaching any NEAR tokens to be deposited in the target contract (`NO_DEPOSIT`).

### Gas

The NEAR network charges a tiny fee on every transaction. This fee is known as **gas**. You have to pay it upfront when you send a transaction.

Every action in NEAR costs a fixed amount of **gas units**. Gas units are usually expressed as `Tgas` (1 TGas = 10^12 gas). One `TGas` gets you approximately 1 ms of compute time on the network.

You can learn more about gas in [NEAR documentation](https://docs.near.org/concepts/protocol/gas).

### Signer vs Predecessor Account

The target contract can obtain information about who is calling the function. When doing so, it's important to distinguish between the predecessor and signer account:

**Predecessor account** is the account that initiated the transaction. In the example above, it would be the account where `MyPortfolioContract` is deployed (e.g. `my-portfolio.near`).

**Signer account** is the account that initiated (signed) the original transaction that led to this function call. In the example above, the signer would be the user account that called the `rebalance_portfolio` method (e.g. `alice.near`).

Ther `near` environment provides two methods to retrieve these accounts:

- `near.predecessorAccountId()`
- `near.signerAccountId()`

## Exercise

The `play` method on our game contract can now be called by anyone. This means anyone can effectively end the game at any time.

In this exercise, we will introduce another smart contract called `GameManager`. This contract will be responsible for managing the game's lifecycle.

1. [ ] Implement the `execute` method on the `GameManager` contract. This method should call `play` method on the provided game contract.
2. [ ] Restrict access to the `play` method so that only the contract deployed at `game-manager.near` can call it. Throw error with text `Unauthorized` if someone else tries to call the method.
