In the previous lesson, we discovered an interesting thing: the withdrawal counter is updated even if the withdrawal fails. Why is that?

Notice that the withdrawal is performed by making a cross-contract call - specifically, calling the `ft_transfer` method of the fungible token contract. The problem is that this call is asynchronous. The `withdraw` method executes immediately, but the actual `ft_transfer` transfer will happen later in another block.

The `withdraw` method does not know if the `ft_transfer` was successful or not. It merely schedules the cross-contract call and increments the counter. This is why the counter is updated even if the transfer fails.

To address this, we need to wait for the result of the transfer and only increment the counter if the transfer was successful.

### Callbacks

To get the result of the cross-contract call, we need to use a callback. A callback is another method on the contract that will be called when the cross-contract call is completed.

Let's add a callback to our contract:

```typescript
@call({})
withdraw({ amount }: { amount: string }) {
  return NearPromise.new('agr-token.test.near')
    .functionCall(
      'ft_transfer',
      JSON.stringify({ receiver_id: near.predecessorAccountId(), amount }),
      DEPOSIT,
      GAS,
    )
    .then(
      NearPromise.new(near.currentAccountId()).functionCall(
        'ft_transfer_callback',
        '',
        undefined,
        GAS,
      ),
    );
}

@call({ privateFunction: true })
ft_transfer_callback() {
  let success;
  try {
    const res = near.promiseResult(0);
    success = true;
  } catch (err) {
    success = false;
  }
}
```

A few things to note here:

- We scheduled another contract call to happen after the `ft_transfer` call using `NearPromise.then()`. This call will be executed even if the `ft_transfer` call fails.
- This second call invokes `ft_transfer_callback` method. This method is marked as `privateFunction` because if it weren't, anyone could call it and increment the counter without making a withdrawal.
- To get the result of the `ft_transfer` call, we use the `near.promiseResult()` function. If the call failed, it will throw an error.

NEAR guarantees that all calls scheduled by the `withdraw` method will be executed. If the `ft_transfer` call fails, the `ft_transfer_callback` will still be executed. In a theoretical case where the network is overloaded with activity and unable to accept new transactions, the calls might be delayed. However, they will be executed eventually once the network returns to normal.

### Why are cross-contract calls asynchronous?

You might be wondering why cross-contract calls are asynchronous. Why not do what other chains do and make them synchronous?

The reason lies in the design of the NEAR. NEAR is a sharded blockchain, meaning the network is divided into multiple shards, each functioning essentially as its own blockchain. Each shard holds its own data and processes its own transactions.

This design allows the network to scale horizontally. When the network becomes congested, a new shard can be added, increasing the total number of transactions per second the network can process.

All data for a single account is always stored on a single shard. This means that if the contract interacts only with its own state, it can execute synchronously. However, if the contract needs to interact with another account, it might need to make a cross-shard call. This call needs to be asynchronous as the current shard might not have the data for the target account.

## Exercise

1. [ ] Update the `withdraw` method in the `faucet` contract to use a callback.
2. [ ] Increment the `withdrawals` counter only if the transfer was successful.
3. [ ] Fix tests.
