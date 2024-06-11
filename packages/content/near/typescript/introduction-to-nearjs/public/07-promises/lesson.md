In the last lesson, we have introduced the concept of asynchronous operations and the `NearPromise` class. In this lesson, we will look at how you can work with promises in more detail.

You are already familiar with this example that schedules an asynchronous transfer of NEAR tokens:

```typescript
@call({ })
near_withdraw() {
  return NearPromise.new(near.signerAccountId()).transfer(1_000_000n);
}
```

By scheduling an asynchronous operation, you are telling the platform that you would like to perform an action in the future. In the case of NEAR, "future" refers to the next block. The example above schedules a transfer of `1,000,000` yoctoNEAR to the specified account to be included in the next block.

### Combining promises

Similar to JavaScript promises, `NearPromise` allows you to chain multiple asynchronous operations to run one after another:

```typescript
@call({ })
near_withdraw() {
  return NearPromise.new('alice.near').transfer(1_000_000n)
    .then(NearPromise.new('bob.near').transfer(1_000_000n))
    .then(NearPromise.new('carol.near').transfer(1_000_000n));
}
```

In the example above, we first send tokens to `alice.near`. When this operation completes, we send tokens to `bob.near`, and so on.

There is a subtle difference between JavaScript promises and `NearPromise`. In JavaScript, you can pass a callback to the `then` method, but in NEAR, `then` method does not accept a callback. Instead, it accepts another promise object directly.

The operations in the previous example are executed sequentially - one after another. You can also run them in parallel by using the `and()` method:

```typescript
@call({ })
near_withdraw() {
  return NearPromise.new('alice.near').transfer(1_000_000n)
    .and(NearPromise.new('bob.near').transfer(1_000_000n))
    .and(NearPromise.new('carol.near').transfer(1_000_000n));
}
```

Here, all three transfers are scheduled simultaneously.

There is one problem with the above example. It fails with `Returning joint promise is currently prohibited.`. This is a known limitation of JS SDK. To work around this, you need to add callback with the `NearPromise.then()` at the end of the chain:

```typescript
@call({ })
near_withdraw() {
  return NearPromise.new('alice.near').transfer(1_000_000n)
    .and(NearPromise.new('bob.near').transfer(1_000_000n))
    .and(NearPromise.new('carol.near').transfer(1_000_000n));
    .then(
      NearPromise.new(near.currentAccountId()).functionCall(
        'witdraw_callback',
        '',
        undefined,
        GAS
      )
    );
}

@call({ privateFunction: true })
witdraw_callback() {
  // do nothing
}
```

We will talk about callbacks in more detail in later lessons.

### Orphaned promises

If a promise is not returned from a method, it is referred to as "orphaned." **Orphaned promises are not executed**.

```typescript
@call({ })
near_withdraw() {
  // promise will not be executed
  NearPromise.new('alice.near').transfer(1_000_000n);
}
```

Apart from forgetting to return a promise, there is another case where you can create an orphaned promise inadvertently:

```typescript
@call({ })
near_withdraw() {
  const promise = NearPromise.new('alice.near').transfer(1_000_000n);
  // transfer to bob.near is orphaned!
  promise.then(NearPromise.new('bob.near').transfer(1_000_000n));
  return promise;
}
```

In this example, the transfer to `bob.near` is orphaned. Both transfers will execute, but if the transfer to `bob.near` fails, the caller of `near_withdraw` will not know about it.

To fix this, make sure you return the result of `promise.then()` instead:

```typescript
@call({ })
near_withdraw() {
  let promise = NearPromise.new('alice.near').transfer(1_000_000n);
  promise = promise.then(NearPromise.new('bob.near').transfer(1_000_000n));
  return promise;
}
```

Sometimes you may want to execute the promise but don't wait for its result. In this case, you can use the `build` method:

```typescript
@call({ })
near_withdraw() {
  NearPromise.new('alice.near').transfer(1_000_000n).build();
}
```

## Exercise

In this exercise, you will implement a method that aborts the game and returns tokens to the players.

1. [ ] Create a method named `abort`. This method should return all the tokens to the players. Use `Promise.then` to chain the transfers.
