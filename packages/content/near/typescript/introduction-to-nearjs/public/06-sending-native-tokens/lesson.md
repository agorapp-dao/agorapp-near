In the last lesson, you learned how to create a method that can receive tokens. In this lesson, we will explore how you can send tokens from a contract to another account.

In NEAR, transferring tokens is an asynchronous operation. The JavaScript SDK provides a class called `NearPromise`, that allows you to make various asynchronous operations, including transferring tokens.

In many respects, `NearPromise` is similar to JavaScript's `Promise` class. It allows you to schedule an asynchronous operation and wait for its completion. Consider the following example:

```typescript
@call({ })
near_withdraw() {
  return NearPromise.new(near.signerAccountId()).transfer(1_000_000n);
}
```

We start by creating a promise with `NearPromise.new()` and specifying the target account for the operation. We then use the `transfer()` method to specify that we want to transfer `1,000,000` yoctoNEAR to this account.

Note that it is important to return the promise from the method. If you don't return it, the promise will not be executed.

## Exercise

In this exercise, you will implement a method that picks the winner of the game and transfers all the contract's tokens to the winner's account.

1. [ ] Create a callable method called `play`.
2. [ ] Select a random winner by calling the `pick_winner` method.
3. [ ] Transfer all the contract's tokens to the winner's account. Note that you can access the contract's environment via the `near` object to get the account's balance.

Note on randomness: Generating random data in the context of a smart contract running on the blockchain is a complex topic. The `pick_winner` method provided here is very basic and can potentially be exploited by malicious actors. See [Random Numbers](https://docs.near.org/build/smart-contracts/security/random) topic in NEAR documentation to learn more.
