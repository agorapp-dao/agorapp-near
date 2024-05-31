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

  // create a subaccount for the contract (agr-faucet.test.near)
  const faucet = await root.createSubAccount('agr-faucet');
  await faucet.deploy('faucet.wasm');

  // create a subaccount for the fungible token contract and ititialize it (agr-token.test.near):
  const agrToken = await root.createSubAccount('agr-token');
  await agrToken.deploy('fungible_token.wasm');
  await root.call(agrToken.accountId, 'new', {
    owner_id: faucet.accountId,
    total_supply: '1000',
    metadata: {
      spec: 'ft-1.0.0',
      name: `Agorapp Token`,
      symbol: 'AGR',
      decimals: 0,
    },
  });

  // create one user account (alice.test.near)
  const alice = await root.createSubAccount('alice');

  accounts = { root, faucet, agrToken, alice };
});

afterEach(async () => {
  // Stop the NEAR sandbox
  await worker.tearDown();
});

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
  await assert.rejects(alice.call(faucet.accountId, 'withdraw', { amount: '1500' }));

  const withdrawals = await faucet.view('get_withdrawals');
  // Note that the withdrawal counter has been updated even though the withdrawal failed.
  // We will address this in the next lesson.
  assert.equal(withdrawals, 1);
});
