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

  const alice = await root.createSubAccount('alice');
  const bob = await root.createSubAccount('bob');
  const carol = await root.createSubAccount('carol');

  accounts = { root, agrToken, faucet, alice, bob, carol };
});

afterEach(async () => {
  // Stop the NEAR sandbox
  await worker.tearDown();
});

test('Payout tokens', async () => {
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
