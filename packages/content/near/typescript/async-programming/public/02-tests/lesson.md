The `withdraw` method you implemented in the previous lesson is pretty simple:

```typescript
@call({})
withdraw({ amount }: { amount: string }) {
  this.withdrawals++;
  return NearPromise.new('agr-token.test.near').functionCall(
    'ft_transfer',
    JSON.stringify({ receiver_id: near.predecessorAccountId(), amount }),
    DEPOSIT,
    GAS,
  );
}
```

But does it always work as expected?

In this lesson, you will learn how to test your smart contracts.

### NEAR Workspaces

NEAR provides an npm package called [near-workspaces](https://www.npmjs.com/package/near-workspaces). This package allows you to run your smart contracts in a local environment, which is very useful for testing.

We have already created a test boilerplate for you. Just select the `test.ts` file on the right.

Let's go through what's happening in the test. First, we need to create a local testing environment:

```typescript
import { Worker } from 'near-workspaces';

worker = await Worker.init();
```

There is one account already created for you: `test.near`. You can access this account using the `worker.rootAccount` object.

Next, we create another account and deploy a contract compiled from `faucet.ts` to it:

```typescript
const contract = await root.createSubAccount('agr-faucet');
await contract.deploy('faucet.wasm');
```

This creates an account with id `agr-faucet.test.near`.

In the contract, we are calling a method on the fungible token contract (`agr-token`), so we have to deploy this contract as well:

```typescript
const agrToken = await root.createSubAccount('agr-token');
await agrToken.deploy('fungible_token.wasm');
await root.call(agrToken.accountId, 'new', {
  owner_id: contract.accountId,
  total_supply: '1000',
  metadata: {
    spec: 'ft-1.0.0',
    name: `Agorapp Token`,
    symbol: 'AGR',
    decimals: 0,
  },
});
```

Notice that we have also initialized the `agr-token` contract with some information about the token and initial balance.

Finally, we create one user account:

```typescript
const alice = await root.createSubAccount('alice');
```

To interact with the contract, we use account objects from `near-workspaces`. For example, to call the view method on the `agr-faucet` contract, we would do the following:

```typescript
const res = await contract.view('method_name');
```

To invoke a call method on the contract, we would typically do the following:

```typescript
const res = await alice.call('agr-faucet.test.near', 'method_name', { arg1: '1', arg2: '2' });

// or without hardcoding the account id of the contract name:
const res = await alice.call(contract.accountId, 'method_name', { arg1: '1', arg2: '2' });
```

Note that we are using the `alice` account to call the contract method. This is important as it means we are calling the method on behalf of Alice.

The `call` method from `near-workspaces` also accepts third optional argument, which allows you to specify the amount of NEAR tokens to attach to the call and the maximum amount of gas to use:

```typescript
const res = await alice.call(
  contract.accountId,
  'method_name',
  { arg1: '1', arg2: '2' },
  { attachedDeposit: NEAR.parse('1 N'), gas: 10_000_000_000_000n },
);
```

### Assertions

When writing tests, you will need to check if the contract behaves as expected. This is done by writing assertions.

In this course, we are using [Assert](https://nodejs.org/api/assert.html) from Node.js. Here is an example of how to write an assertion:

```typescript
// assert that balance equals 100
assert.equal(balance, 100n);

// assert that alice call fails asynchronously with a specific error message
await assert.rejects(alice.call('some-contract.near', 'some-method', {}), {
  message: `Error: Failed to do something`,
});
```

## Exercise

In this exercise you will write two test-cases for the `withdraw` method:

1. [ ] `Successful withdrawal` - Test that alice receives `AGR` tokens from the faucet and that the withdrawal counter is increased by one.
2. [ ] `Insufficient balance` - Test what happens when there is not enough balance in the faucet. Is the withdrawal counter increased?
