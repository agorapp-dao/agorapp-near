**faucet.ts**

To fix the issue, you have to make sure, that you store the reference returned by `promise.and()` and `promise.then()`:

```typescript
promise = promise.and(
  NearPromise.new('ft.test.near').functionCall(
    'ft_transfer',
    JSON.stringify({ receiver_id: receivers[i], amount: '100' }),
    DEPOSIT,
    GAS,
  ),
);
```

**test.ts**

```typescript
test('Payout tokens', async () => {
  const { faucet, agrToken, alice, bob, carol } = accounts;

  await faucet.call(faucet.accountId, 'payout', {
    receivers: [alice.accountId, bob.accountId, carol.accountId],
  });

  const balances = {
    alice: await agrToken.view('ft_balance_of', { account_id: alice.accountId }),
    bob: await agrToken.view('ft_balance_of', { account_id: bob.accountId }),
    carol: await agrToken.view('ft_balance_of', { account_id: carol.accountId }),
  };

  assert.equal(balances.alice, 100n);
  assert.equal(balances.bob, 100n);
  assert.equal(balances.carol, 100n);
});
```
