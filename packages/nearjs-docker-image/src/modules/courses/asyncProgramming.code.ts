import { TEditorFileMap } from '@agorapp-dao/runner-common/src/types';
import dedent from 'ts-dedent';
import { cloneDeep } from 'lodash';

export const FUNGIBLE_TOKEN_CONTRACT = dedent`
import { call, view, near, NearBindgen, NearPromise } from 'near-sdk-js';

const GAS = 10_000_000_000_000n;

@NearBindgen({})
class FungibleToken {
  symbol = 'AGR';
  balances = {};

  @call({})
  new({ owner_id, total_supply }: { owner_id: string; total_supply: string }) {
    this.balances[owner_id] = BigInt(total_supply);
  }

  @view({})
  ft_balance_of({ account_id }: { account_id: string }) {
    return this.balances[account_id] ?? 0n;
  }

  @call({ payableFunction: true })
  ft_transfer({ receiver_id, amount }: { receiver_id: string; amount: string }) {
    const sender_id = near.predecessorAccountId();
    const sender_balance = this.balances[sender_id] ?? 0n;
    const receiver_balance = this.balances[receiver_id] ?? 0n;

    if (sender_balance < BigInt(amount)) {
      throw new Error(\`The \${sender_id} account doesn't have enough balance\`);
    }

    this.balances[sender_id] = sender_balance - BigInt(amount);
    this.balances[receiver_id] = receiver_balance + BigInt(amount);

    return NearPromise.new(receiver_id)
      .functionCall('ft_on_transfer', JSON.stringify({ sender_id, amount, msg: '' }), 0n, GAS)
      .then(NearPromise.new(near.currentAccountId()).functionCall('noop', '', 0n, GAS));
  }

  @call({ privateFunction: true })
  noop() {}
}
`;

export const CODE_01_VALID: TEditorFileMap = {
  'faucet.ts': {
    content: dedent`
      import { NearBindgen, near, call, view, NearPromise, LookupMap } from 'near-sdk-js';
  
      const GAS = 10_000_000_000_000n;
      const DEPOSIT = 1n; // 1 yoctoNEAR
      
      @NearBindgen({})
      class AgrTokenFaucet {
        withdrawals = 0;
      
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
      
        @view({})
        get_withdrawals() {
          return this.withdrawals;
        }
      }
    `,
  },
};

export const CODE_02_VALID: TEditorFileMap = {
  'faucet.ts': {
    content: dedent`
      import { NearBindgen, near, call, view, NearPromise, LookupMap } from 'near-sdk-js';
      
      const GAS = 10_000_000_000_000n;
      const DEPOSIT = 1n; // 1 yoctoNEAR
      
      @NearBindgen({})
      class AgrTokenFaucet {
        withdrawals = 0;
      
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
      
        @view({})
        get_withdrawals() {
          return this.withdrawals;
        }
      }
    `,
  },
  'test.ts': {
    content: dedent`
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
            name: \`Agorapp Token\`,
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
        await alice.call(faucet.accountId, 'withdraw', {amount: '100'});
      
        const balance = await agrToken.view('ft_balance_of', {account_id: alice.accountId});
        assert.equal(balance, 100n);
      
        const withdrawals = await faucet.view('get_withdrawals');
        assert.equal(withdrawals, 1);
      });
      
      test('Insufficient balance', async () => {
        const { alice, faucet, agrToken } = accounts;
        await assert.rejects(
          alice.call(faucet.accountId, 'withdraw', { amount: '1500' }), 
          { message: \`The agr-faucet.test.near account doesn't have enough balance\` }
        );
      
        const withdrawals = await faucet.view('get_withdrawals');
        assert.equal(withdrawals, 1);
      });
    `,
  },
};

export const CODE_02_EMPTY_TESTS = cloneDeep(CODE_02_VALID);
CODE_02_EMPTY_TESTS['test.ts'].content = dedent`
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
        name: \`Agorapp Token\`,
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
  });
  
  test('Insufficient balance', async () => {
  });

`;

export const CODE_02_NOOP_CONTRACT = dedent`
  import { NearBindgen, near, call, view, NearPromise, LookupMap } from 'near-sdk-js';
  
  const GAS = 10_000_000_000_000n;
  const DEPOSIT = 1n; // 1 yoctoNEAR
  
  @NearBindgen({})
  class AgrTokenFaucet {
    withdrawals = 0;
  
    @call({})
    withdraw({ amount }: { amount: string }) {
    }
  
    @view({})
    get_withdrawals() {
      return this.withdrawals;
    }
  }
`;

export const CODE_03_VALID: TEditorFileMap = {
  'faucet.ts': {
    content: dedent`
      import { NearBindgen, near, call, view, NearPromise } from 'near-sdk-js';
      
      const GAS = 10_000_000_000_000n;
      const DEPOSIT = 1n; // 1 yoctoNEAR
      
      @NearBindgen({})
      class AgrTokenFaucet {
        withdrawals = 0;
      
      @call({})
      withdraw({ amount }: { amount: string }) {
        return NearPromise.new('agr-token.test.near')
          .functionCall(
            'ft_transfer',
            JSON.stringify({ receiver_id: near.predecessorAccountId(), amount }),
            DEPOSIT,
            GAS,
          )
          .then(
            NearPromise.new(near.currentAccountId()).functionCall(
              'ft_transfer_callback',
              '',
              undefined,
              GAS,
            ),
          );
      }
      
      @call({ privateFunction: true })
      ft_transfer_callback() {
        let success;
        try {
          const res = near.promiseResult(0);
          success = true;
        } catch (err) {
          success = false;
        }
        
        if (success) {
          this.withdrawals++;
        }
      }
    
      @view({})
      get_withdrawals() {
        return this.withdrawals;
      }
    }
    `,
  },
  'test.ts': {
    content: dedent`
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
            name: \`Agorapp Token\`,
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
        await alice.call(faucet.accountId, 'withdraw', {amount: '100'});
      
        const balance = await agrToken.view('ft_balance_of', {account_id: alice.accountId});
        assert.equal(balance, 100n);
      
        const withdrawals = await faucet.view('get_withdrawals');
        assert.equal(withdrawals, 1);
      });
      
      test('Insufficient balance', async () => {
        const { alice, faucet, agrToken } = accounts;
        await assert.rejects(
          alice.call(faucet.accountId, 'withdraw', { amount: '1500' }), 
          { message: \`The agr-faucet.test.near account doesn't have enough balance\` }
        );
      
        const withdrawals = await faucet.view('get_withdrawals');
        assert.equal(withdrawals, 1);
      });
    `,
  },
};

export const CODE_04_VALID: TEditorFileMap = {
  'faucet.ts': {
    content: dedent`
      import { NearBindgen, near, call, view, NearPromise } from 'near-sdk-js';
      
      const GAS = 10_000_000_000_000n;
      const DEPOSIT = 1n; // 1 yoctoNEAR
      
      @NearBindgen({})
      class AgrTokenFaucet {
        withdrawals = 0;
      
        @call({})
        withdraw({ amount }: { amount: string }) {
          return NearPromise.new('agr-token.test.near')
            .functionCall(
              'ft_transfer',
              JSON.stringify({ receiver_id: near.predecessorAccountId(), amount }),
              DEPOSIT,
              GAS,
            )
            .then(
              NearPromise.new(near.currentAccountId()).functionCall(
                'ft_transfer_callback',
                '',
                undefined,
                GAS,
              ),
            );
        }
      
        @call({ privateFunction: true })
        ft_transfer_callback() {
          let success;
          try {
            const res = near.promiseResult(0);
            success = true;
          } catch (err) {
            success = false;
          }
      
          if (success) {
            this.withdrawals++;
          }
        }
      
        @view({})
        get_withdrawals() {
          return this.withdrawals;
        }
      
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
      }

    `,
  },
  'test.ts': {
    content: dedent`
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
            name: \`Agorapp Token\`,
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
          message: \`The agr-faucet.test.near account doesn't have enough balance\`,
        });
      
        const withdrawals = await faucet.view('get_withdrawals');
        // Note that the withdrawal counter has been updated even though the withdrawal failed.
        // We will address this in the next lesson.
        assert.equal(withdrawals, 0);
      });
      
      test('Transfer tokens', async () => {
        const { faucet, agrToken, alice, bob, carol } = accounts;
      
        await faucet.call(faucet.accountId, 'payout', {});
      
        const balances = {
          alice: await agrToken.view('ft_balance_of', { account_id: alice.accountId }),
          bob: await agrToken.view('ft_balance_of', { account_id: bob.accountId }),
          carol: await agrToken.view('ft_balance_of', { account_id: carol.accountId }),
        }
      
        assert.equal(balances.alice, 100n);
        assert.equal(balances.bob, 100n);
        assert.equal(balances.carol, 100n);
      });
    `,
  },
};

export const CODE_04_JOINT_PROMISE = cloneDeep(CODE_04_VALID);
CODE_04_JOINT_PROMISE['faucet.ts'].content = dedent`
import { NearBindgen, near, call, view, NearPromise } from 'near-sdk-js';

const GAS = 10_000_000_000_000n;
const DEPOSIT = 1n; // 1 yoctoNEAR

@NearBindgen({})
class AgrTokenFaucet {
  withdrawals = 0;

  @call({})
  withdraw({ amount }: { amount: string }) {
    return NearPromise.new('agr-token.test.near')
      .functionCall(
        'ft_transfer',
        JSON.stringify({ receiver_id: near.predecessorAccountId(), amount }),
        DEPOSIT,
        GAS,
      )
      .then(
        NearPromise.new(near.currentAccountId()).functionCall(
          'ft_transfer_callback',
          '',
          undefined,
          GAS,
        ),
      );
  }

  @call({ privateFunction: true })
  ft_transfer_callback() {
    let success;
    try {
      const res = near.promiseResult(0);
      success = true;
    } catch (err) {
      success = false;
    }

    if (success) {
      this.withdrawals++;
    }
  }

  @view({})
  get_withdrawals() {
    return this.withdrawals;
  }

  @call({})
  payout() {
    return NearPromise.new('agr-token.test.near')
      .functionCall(
        'ft_transfer',
        JSON.stringify({ receiver_id: 'alice.test.near', amount: '100' }),
        DEPOSIT,
        GAS,
      )
      .and(
        NearPromise.new('agr-token.test.near').functionCall(
          'ft_transfer',
          JSON.stringify({ receiver_id: 'bob.test.near', amount: '100' }),
          DEPOSIT,
          GAS,
        )
      )
      .and(
        NearPromise.new('agr-token.test.near').functionCall(
          'ft_transfer',
          JSON.stringify({ receiver_id: 'carol.test.near', amount: '100' }),
          DEPOSIT,
          GAS,
        )
      )
  }
}
`;

export const CODE_05_VALID: TEditorFileMap = {
  'faucet.ts': {
    content: dedent`
      import { NearBindgen, near, call, view, NearPromise } from 'near-sdk-js';
      
      const GAS = 10_000_000_000_000n;
      const DEPOSIT = 1n; // 1 yoctoNEAR
      
      @NearBindgen({})
      class AgrTokenFaucet {
      
        @call({})
        payout({ receivers }: { receivers: string[] }) {
          if (receivers.length === 0) {
            throw new Error('No receivers provided');
          }
      
          let promise = NearPromise.new('agr-token.test.near').functionCall(
            'ft_transfer',
            JSON.stringify({ receiver_id: receivers[0], amount: '100' }),
            DEPOSIT,
            GAS,
          );
      
          for (let i = 1; i < receivers.length; i++) {
            promise = promise.and(
              NearPromise.new('agr-token.test.near').functionCall(
                'ft_transfer',
                JSON.stringify({ receiver_id: receivers[i], amount: '100' }),
                DEPOSIT,
                GAS,
              ),
            );
          }
      
          promise = promise.then(
            NearPromise.new(near.currentAccountId()).functionCall(
              'ft_transfer_callback',
              '',
              undefined,
              GAS,
            ),
          );
      
          return promise;
        }

        @call({ privateFunction: true })
        ft_transfer_callback() {
          // do nothing
        }
      }
    `,
  },
  'test.ts': {
    content: dedent`
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
            name: \`Agorapp Token\`,
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
      
        await faucet.call(faucet.accountId, 'payout', {receivers: [alice.accountId, bob.accountId, carol.accountId]});
      
        const balances = {
          alice: await agrToken.view('ft_balance_of', { account_id: alice.accountId }),
          bob: await agrToken.view('ft_balance_of', { account_id: bob.accountId }),
          carol: await agrToken.view('ft_balance_of', { account_id: carol.accountId }),
        }
      
        assert.equal(balances.alice, 100n);
        assert.equal(balances.bob, 100n);
        assert.equal(balances.carol, 100n);
      });
    `,
  },
};

export const CODE_05_INVALID = cloneDeep(CODE_05_VALID);
CODE_05_INVALID['faucet.ts'].content = dedent`
  import { NearBindgen, near, call, view, NearPromise } from 'near-sdk-js';
  
  const GAS = 10_000_000_000_000n;
  const DEPOSIT = 1n; // 1 yoctoNEAR
  
  @NearBindgen({})
  class AgrTokenFaucet {
  
    @call({})
    payout({ receivers }: { receivers: string[] }) {
      if (receivers.length === 0) {
        throw new Error('No receivers provided');
      }
  
      let promise = NearPromise.new('agr-token.test.near').functionCall(
        'ft_transfer',
        JSON.stringify({ receiver_id: receivers[0], amount: '100' }),
        DEPOSIT,
        GAS,
      );
  
      for (let i = 1; i < receivers.length; i++) {
        promise.and(
          NearPromise.new('agr-token.test.near').functionCall(
            'ft_transfer',
            JSON.stringify({ receiver_id: receivers[i], amount: '100' }),
            DEPOSIT,
            GAS,
          ),
        );
      }
  
      promise.then(
        NearPromise.new(near.currentAccountId()).functionCall(
          'ft_transfer_callback',
          '',
          undefined,
          GAS,
        ),
      );
  
      return promise;
    }
  
    @call({ privateFunction: true })
    ft_transfer_callback() {
      // do nothing
    }
  }
`;

export const CODE_06_VALID: TEditorFileMap = {
  'swap.ts': {
    content: dedent`
      import { NearBindgen, near, call, view, LookupMap, NearPromise } from 'near-sdk-js';
  
      const GAS = 10_000_000_000_000n;
      const DEPOSIT = 1n; // 1 yoctoNEAR
      
      @NearBindgen({})
      class TokenSwap {
        balances = new LookupMap<bigint>('balances');
      
        @call({})
        ft_on_transfer({ sender_id, amount, msg }: { sender_id: string; amount: string; msg: string }) {
          const tokenId = near.predecessorAccountId();
          const key = \`\${tokenId}:\${sender_id}\`;
          this.balances.set(key, this.balances.get(key) ?? 0n + BigInt(amount));
        }
      
        @call({})
        swap({ amount }: { amount: string }) {
          const amountInt = BigInt(amount);
      
          const aliceAbc = this.balances.get('abc-token.test.near:alice.test.near') ?? 0n;
          const aliceXyz = this.balances.get('xyz-token.test.near:alice.test.near') ?? 0n;
          const bobAbc = this.balances.get('abc-token.test.near:bob.test.near') ?? 0n;
          const bobXyz = this.balances.get('xyz-token.test.near:bob.test.near') ?? 0n;
      
          if (aliceAbc < amountInt) {
            throw new Error(\`Alice does not have enough ABC tokens to perform the swap\`);
          }
          if (bobXyz < amountInt) {
            throw new Error(\`Bob does not have enough XYZ tokens to perform the swap\`);
          }
      
          this.balances.set('abc-token.test.near:alice.test.near', aliceAbc - amountInt);
          this.balances.set('abc-token.test.near:bob.test.near', bobAbc + amountInt);
      
          this.balances.set('xyz-token.test.near:alice.test.near', aliceXyz + amountInt);
          this.balances.set('xyz-token.test.near:bob.test.near', bobXyz - amountInt);
        }
      
        @call({})
        ft_withdraw({ token_id, amount }: { token_id: string; amount: string }) {
          const amountInt = BigInt(amount);
          const balance = this.balances.get(\`\${token_id}:\${near.predecessorAccountId()}\`);
      
          if (amountInt > balance) {
            throw new Error(\`\${near.predecessorAccountId()} does not have enough balance of \${token_id}\`);
          }
      
          this.balances.set(\`\${token_id}:\${near.predecessorAccountId()}\`, balance - amountInt);
      
          return NearPromise.new(token_id)
            .functionCall(
              'ft_transfer',
              JSON.stringify({ receiver_id: near.predecessorAccountId(), amount: amount }),
              DEPOSIT,
              GAS,
            )
            .then(
              NearPromise.new(near.currentAccountId()).functionCall(
                'ft_transfer_callback',
                '',
                0n,
                GAS
              )
            )
      
        }
      
        @call({ privateFunction: true })
        ft_transfer_callback({token_id, receiver_id, amount}: {token_id: string, receiver_id: string, amount: string}) {
          let success = true;
          try {
            near.promiseResult(0);
          } catch (err) {
            success = false;
          }
      
          if (!success) {
            // rollback balance change
            const amountInt = BigInt(amount);
            const balance = this.balances.get(\`\${token_id}:\${receiver_id}\`) ?? 0n;
            this.balances.set(\`\${token_id}:\${receiver_id}\`, balance + amountInt)
          }
      
        }
      }
    `,
  },
  'test.ts': {
    content: dedent`
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
            name: \`Alice's Token\`,
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
            name: \`Bob's Token\`,
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
      
      test('Swap 10 tokens', async () => {
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
          \`Alice should have 900 ABC tokens, but has \${aliceBalances.abc}\`,
        );
        assert.equal(
          aliceBalances.xyz,
          100n,
          \`Alice should have 100 XYZ tokens, but has \${aliceBalances.xyz}\`,
        );
        assert.equal(bobBalances.abc, 100n, \`Bob should have 100 ABC tokens, but has \${bobBalances.abc}\`);
        assert.equal(bobBalances.xyz, 900n, \`Bob should have 900 XYZ tokens, but has \${bobBalances.xyz}\`);
      });
    `,
  },
};
