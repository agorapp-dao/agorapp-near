**faucet.ts**

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
      JSON.stringify({ receiver_id: 'bob.test.near', amount: '100' }),
      DEPOSIT,
      GAS,
    )
    .functionCall(
      'ft_transfer',
      JSON.stringify({ receiver_id: 'carol.test.near', amount: '100' }),
      DEPOSIT,
      GAS,
    )
}
```

**test.ts**

```typescript
beforeEach(async () => {
  // ...

  // make sure to create all user accounts needed for the test
  const alice = await root.createSubAccount('alice');
  const bob = await root.createSubAccount('bob');
  const carol = await root.createSubAccount('carol');

  accounts = { root, agrToken, faucet, alice, bob, carol };
});

afterEach(async () => {
  // Stop the NEAR sandbox
  await worker.tearDown();
});

// ... test cases from previous lessons

test('Transfer tokens', async () => {
  const { faucet, agrToken, alice, bob, carol } = accounts;

  await faucet.call(faucet.accountId, 'payout', {});

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
