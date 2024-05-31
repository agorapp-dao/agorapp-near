```typescript
test('Successful withdrawal', async () => {
  const { alice, faucet, agrToken } = accounts;
  await alice.call(faucet.accountId, 'withdraw', { amount: '100' });

  const balance = await agrToken.view('ft_balance_of', { account_id: alice.accountId });
  assert.equal(balance, 100n);

  const withdrawals = await faucet.view('get_withdrawals');
  assert.equal(withdrawals, 1);
});

test('Insufficient balance', async () => {
  const { alice, faucet, agrToken } = accounts;
  await assert.rejects(alice.call(faucet.accountId, 'withdraw', { amount: '1500' }), {
    message: `The agr-faucet.test.near account doesn't have enough balance`,
  });

  const withdrawals = await faucet.view('get_withdrawals');
  // Note that the withdrawal counter has been updated even though the withdrawal failed.
  // We will address this in the next lesson.
  assert.equal(withdrawals, 1);
});
```
