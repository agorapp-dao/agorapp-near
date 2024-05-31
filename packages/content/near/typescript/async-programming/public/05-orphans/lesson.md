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

Note that the behavior of the NEAR JavaScript SDK differs here from that of the Rust SDK. In the Rust SDK, orphaned promises are executed, which is useful if you want to execute some side effects that are independent of the method result. There is a [bug in JavaScript SDK](https://github.com/near/near-sdk-js/issues/387) open for this.

## Exercise

In the example above, the orphaned promise is easy to spot. However, sometimes it can be less obvious. Can you find the orphaned promise in the `payout` method?

1. [ ] Fix the `payout` method.
2. [ ] Fix the test for the `payout` method.
