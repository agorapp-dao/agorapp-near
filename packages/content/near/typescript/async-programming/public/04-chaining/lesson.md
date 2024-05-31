### Chaining operations with NearPromise.then

You can schedule multiple cross-contract calls to run one after another by chaining them with the `NearPromise.then()` method. We have already seen this in the previous lesson when we scheduled a callback to run after the `ft_transfer` call:

```typescript
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
```

This is very similar to chaining regular promises in JavaScript. The promise added with the `then` method will be executed after the previous promise completes.

However, there is one important difference: **All promises will execute, even if the previous one fails**. Consider the following example:

```typescript
return NearPromise.new('agr-token.test.near')
  .functionCall(
    'ft_transfer',
    JSON.stringify({ receiver_id: 'alice.test.near', '9999999999' }),
    DEPOSIT,
    GAS,
  )
  .then(
    NearPromise.new('agr-token.test.near')
      .functionCall(
        'ft_transfer',
        JSON.stringify({ receiver_id: 'bob.test.near', '100' }),
        DEPOSIT,
        GAS,
      )
  );
```

The first promise fails with `Exceeded the account balance`. However, the second promise will still be executed, and Bob will receive his tokens.

If it is important for the second promise to run only if the first one is successful, we would need to use a callback and `near.promiseResult()`:

```typescript
@call({})
payout() {
  return NearPromise.new('agr-token.test.near')
    .functionCall(
      'ft_transfer',
      JSON.stringify({ receiver_id: 'alice.test.near', '9999999999' }),
      DEPOSIT,
      GAS,
    )
    .then(
      NearPromise.new(near.currentAccountId()).functionCall(
        'first_transfer_callback',
        '',
        undefined,
        GAS,
      ),
    );
}

@call({ privateFunction: true })
first_transfer_callback() {
  // this will throw if the first transfer failed
  near.promiseResult(0);

  return NearPromise.new('agr-token.test.near')
    .functionCall(
      'ft_transfer',
      JSON.stringify({ receiver_id: 'bob.test.near', '100' }),
      DEPOSIT,
      GAS,
    );
}
```

### Chaining operations with NearPromise.and

Sometimes we want to execute several promises at the same time (in parallel). For this purpose, we can use the `NearPromise.and()` method:

```typescript
return NearPromise.new('agr-token.test.near')
  .functionCall(
    'ft_transfer',
    JSON.stringify({ receiver_id: 'alice.test.near', amount: '100' }),
    DEPOSIT,
    GAS,
  )
  .and(
    NearPromise.new('agr-token.test.near').functionCall(
      'ft_transfer',
      JSON.stringify({ receiver_id: 'bob.test.near', amount: '100' }),
      DEPOSIT,
      GAS,
    ),
  );
```

In the example above, each cross-contract call will take a second to execute. Imagine if we needed to do 100 transfers instead of 2. If we chained them with `then`, it would take 200 seconds to complete all of them. With `and`, the same thing will take only 1 second.

Currently, there is one limitation: You cannot return a promise created with `and` from the method. Attempting to do so will result in the following error:

`Returning joint promise is currently prohibited.`

To work around this, you need to add a callback at the end of the chain with the `then` method:

```typescript
@call({})
payout() {
  return NearPromise.new('agr-token.test.near')
    .functionCall(
      'ft_transfer',
      JSON.stringify({ receiver_id: 'alice.test.near', amount: '100' }),
      DEPOSIT,
      GAS,
    )
    .and(
      NearPromise.new('agr-token.test.near').functionCall(
        'ft_transfer',
        JSON.stringify({ receiver_id: 'bob.test.near', amount: '100' }),
        DEPOSIT,
        GAS,
      ),
    )
    .then(
      NearPromise.new(near.currentAccountId()).functionCall(
        'payout_callback',
        '',
        undefined,
        GAS,
      ),
    );
}

@call({ privateFunction: true })
payout_callback() {
  // do nothing
}
```

### Planning multiple operations on one promise

There is another way to plan multiple operations if the target of the operation is the same. You can simply call the `functionCall` method multiple times on the same promise:

```typescript
@call({})
payout() {
  return NearPromise.new('agr-token.test.near')
    .functionCall(
      'ft_transfer',
      JSON.stringify({ receiver_id: 'alice.test.near', amount: '100' }),
      DEPOSIT,
      GAS,
    )
    .functionCall(
      'ft_transfer',
      JSON.stringify({ receiver_id: 'alice.test.near', amount: '100' }),
      DEPOSIT,
      GAS,
    );
```

In this case, both transfers will be executed in parallel.

## Exercise

1. [ ] Create a method named `payout`.
2. [ ] Transfer 100 tokens to each of `alice.test.near`, `bob.test.near` and `carol.test.near`.
3. [ ] Transfers should happen in parallel.
4. [ ] Add a test for the `payout` method.
