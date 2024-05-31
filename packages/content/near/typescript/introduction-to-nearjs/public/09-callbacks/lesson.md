In the last lesson, you learned how to invoke a method on another contract. However, we have not yet covered one important detail: what happens if you need to know the result of that call?

Here is a cross-contract call from the last lesson:

```typescript
@NearBindgen({})
class MyPortfolioContract {
  @call({})
  rebalance_portfolio() {
    // maximum gas we are willing to pay for the function call
    const GAS = 50_000_000_000_000;
    const NO_DEPOSIT = 0n;

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

Cross-contract calls are executed asynchronously—this means that the result of the call is not immediately available. If the result is important for your contract, you must provide a callback function to be executed when the call completes:

```typescript
@NearBindgen({})
class MyPortfolioContract {
  @call({})
  rebalance_portfolio() {
    return NearPromise.new('trading-platform.near')
      .functionCall(
        'buy_token',
        JSON.stringify({ token: 'XYZ', amount: 3_000 }),
        NO_DEPOSIT,
        FIVE_TGAS,
      )
      .then(
        NearPromise.new(near.currentAccountId()).functionCall(
          'buy_token_callback',
          '',
          NO_DEPOSIT,
          FIVE_TGAS,
        ),
      );
  }

  @call({ privateFunction: true })
  buy_token_callback() {
    const result = near.promiseResult(0 as PromiseIndex);
    if (result === 'success') {
      // update balance on the contract
    }
  }
}
```

We have added a second function call to the promise chain. Note that the `buy_token_callback` method on the current contract is invoked after the first function call completes.

Inside the `buy_token_callback` method, we access the result of the first function call by using the `near.promiseResult` method. The `PromiseIndex` parameter specifies which promise's result we want to access. Here, we are interested in the result of the first promise, so we use `0` as the index.

There is one additional important detail to note: the `buy_token_callback` method is marked as `privateFunction: true`. This means that it can only be called by the contract itself and not by external accounts.

## Exercise

Let's say you are working on the landing page for your game and want to display the number of games played so far. To achieve this, extend the `GameManager` contract:

1. [ ] Add a state variable named `gamesPlayed` and initialize it to `0`.
2. [ ] Add a method named `play_callback` that gets called after each successful `play` method call.
3. [ ] Increment the `gamesPlayed` variable when the `play` call is successful.
