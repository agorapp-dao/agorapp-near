When working with `NearPromise`, there is one thing you need to pay special attention to: You should always return the promise from the method. If you don't, **the promise will become orphaned and will not be executed**.

```typescript
@call({})
withdraw({ amount }: { amount: string }) {
  // Promise is not returned from the method and as a result, it is not executed
  NearPromise.new('agr-token.test.near').functionCall(
    'ft_transfer',
    JSON.stringify({ receiver_id: near.predecessorAccountId(), amount }),
    DEPOSIT,
    GAS,
  );
}
```

Sometimes it is useful to execute a promise without waiting for its result. In this case, you can use the `build` method on the promise:

```typescript
@call({})
withdraw({ amount }: { amount: string }) {
  NearPromise.new('agr-token.test.near').functionCall(
    'ft_transfer',
    JSON.stringify({ receiver_id: near.predecessorAccountId(), amount }),
    DEPOSIT,
    GAS,
  ).build();
}
```

## Exercise

In the example above, the orphaned promise is easy to spot. However, sometimes it can be less obvious. Can you find the orphaned promise in the `payout` method?

1. [ ] Fix the `payout` method.
2. [ ] Fix the test for the `payout` method.
