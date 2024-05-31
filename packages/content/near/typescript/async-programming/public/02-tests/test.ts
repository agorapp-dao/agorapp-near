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

  accounts = { root, faucet, alice, agrToken };
});

afterEach(async () => {
  // Stop the NEAR sandbox
  await worker.tearDown();
});

test('Successful withdrawal', async () => {
  const { alice, faucet, agrToken } = accounts;
  const balance = await agrToken.view('ft_balance_of', { account_id: alice.accountId });
  assert.equal(balance, 0n);

  // TODO: Test that alice can withdraw NEAR tokens from the faucet contract
  assert.fail('todo');
});

test('Insufficient balance', async () => {
  // TODO: Test that alice cannot withdraw more NEAR tokens than the faucet contract has
  assert.fail('todo');
});
