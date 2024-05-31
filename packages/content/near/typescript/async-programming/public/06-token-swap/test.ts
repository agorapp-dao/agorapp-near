import { Worker, NearAccount } from 'near-workspaces';
import { beforeEach, afterEach, test } from 'test-lite';
import assert from 'node:assert';

let worker: Worker;
let accounts: Record<string, NearAccount>;

beforeEach(async () => {
  // Initialize the NEAR sandbox
  worker = await Worker.init();

  // worker has one account by default (test.near)
  const root = worker.rootAccount;

  // create a subaccount for the swap contract (swap.test.near)
  const swap = await root.createSubAccount('swap');
  await swap.deploy('swap.wasm');

  // create user accounts
  const alice = await root.createSubAccount('alice');
  const bob = await root.createSubAccount('bob');

  // create a subaccount for the Alice's token and ititialize it (abc-token.test.near):
  const abcToken = await root.createSubAccount('abc-token');
  await abcToken.deploy('fungible_token.wasm');
  await root.call(abcToken.accountId, 'new', {
    owner_id: alice.accountId,
    total_supply: '1000',
    metadata: {
      spec: 'ft-1.0.0',
      name: `Alice's Token`,
      symbol: 'ABC',
      decimals: 0,
    },
  });

  // create a subaccount for the Bob's token and ititialize it (xyz-token.test.near):
  const xyzToken = await root.createSubAccount('xyz-token');
  await xyzToken.deploy('fungible_token.wasm');
  await root.call(xyzToken.accountId, 'new', {
    owner_id: bob.accountId,
    total_supply: '1000',
    metadata: {
      spec: 'ft-1.0.0',
      name: `Bob's Token`,
      symbol: 'XYZ',
      decimals: 0,
    },
  });

  accounts = { root, swap, alice, bob, abcToken, xyzToken };
});

afterEach(async () => {
  // Stop the NEAR sandbox
  await worker.tearDown();
});

test('Swap 100 tokens', async () => {
  const { swap, alice, bob, abcToken, xyzToken } = accounts;

  // deposit tokens into the swap contract
  await alice.call(abcToken.accountId, 'ft_transfer', {
    receiver_id: swap.accountId,
    amount: '100',
  });
  await bob.call(xyzToken.accountId, 'ft_transfer', { receiver_id: swap.accountId, amount: '100' });

  // perform the swap (anyone can do this)
  await alice.call(swap.accountId, 'swap', { amount: '100' });

  // withdraw tokens
  await alice.call(swap.accountId, 'ft_withdraw', { token_id: xyzToken.accountId, amount: '100' });
  await bob.call(swap.accountId, 'ft_withdraw', { token_id: abcToken.accountId, amount: '100' });

  // check the balances
  const aliceBalances = {
    abc: await abcToken.view('ft_balance_of', { account_id: alice.accountId }),
    xyz: await xyzToken.view('ft_balance_of', { account_id: alice.accountId }),
  };
  const bobBalances = {
    abc: await abcToken.view('ft_balance_of', { account_id: bob.accountId }),
    xyz: await xyzToken.view('ft_balance_of', { account_id: bob.accountId }),
  };
  assert.equal(
    aliceBalances.abc,
    900n,
    `Alice should have 900 ABC tokens, but has ${aliceBalances.abc}`,
  );
  assert.equal(
    aliceBalances.xyz,
    100n,
    `Alice should have 100 XYZ tokens, but has ${aliceBalances.xyz}`,
  );
  assert.equal(bobBalances.abc, 100n, `Bob should have 100 ABC tokens, but has ${bobBalances.abc}`);
  assert.equal(bobBalances.xyz, 900n, `Bob should have 900 XYZ tokens, but has ${bobBalances.xyz}`);
});
