import { NearSdkMock, NearWorkspacesMock } from '@agorapp-dao/nearjs-mock';
import {
  Course,
  CourseBase,
  Lesson,
  LessonBase,
  Test,
  expect,
  JavaScriptUserspace,
  TestLiteService,
  Passes,
  Fails,
} from '@agorapp-dao/runner-common';
import {
  CODE_01_VALID,
  CODE_02_EMPTY_TESTS,
  CODE_02_NOOP_CONTRACT,
  CODE_02_VALID,
  CODE_03_VALID,
  CODE_04_JOINT_PROMISE,
  CODE_04_VALID,
  CODE_05_INVALID,
  CODE_05_VALID,
  CODE_06_VALID,
  FUNGIBLE_TOKEN_CONTRACT,
} from './asyncProgramming.code';

@Course('async-programming')
export class AsyncProgrammingCourse extends CourseBase {
  lessons = [Lesson1, Lesson2, Lesson3, Lesson4, Lesson5, Lesson6];
}

// NEAR-WORKSPACES TESTS FOR THIS COURSE: https://github.com/agorapp-dao/agorapp-nearpromise

@Passes('ok', CODE_01_VALID)
@Lesson('01-introduction')
class Lesson1 extends LessonBase {
  near: NearSdkMock;

  async beforeEach() {
    this.near = new NearSdkMock();
    this.near.addAccount('agr-faucet.test.near', 10n ** 24n);
    await this.near.deploy('agr-token.test.near', FUNGIBLE_TOKEN_CONTRACT);
    await this.near.deploy('agr-faucet.test.near', this.files['faucet.ts'].content);
    this.near.addAccount('alice.test.near');
    this.near.addAccount('bob.test.near');

    // initialize the fungible token contract
    await this.near.call('agr-token.test.near', 'agr-faucet.test.near', 'new', {
      owner_id: 'agr-faucet.test.near',
      total_supply: '1000',
    });
  }

  @Test('Should transfer AGR tokens to the caller')
  async test1() {
    await this.near.call('agr-faucet.test.near', 'alice.test.near', 'withdraw', { amount: '100' });
    await this.near.call('agr-faucet.test.near', 'bob.test.near', 'withdraw', { amount: '200' });
    const tokenContract = this.near.getContract('agr-token.test.near');

    expect(tokenContract.instance.balances['alice.test.near']).to.equal(100n);
    expect(tokenContract.instance.balances['bob.test.near']).to.equal(200n);
  }

  @Test('Should increment the withdrawals counter')
  async test2() {
    await this.near.call('agr-faucet.test.near', 'alice.test.near', 'withdraw', { amount: '100' });
    await this.near.call('agr-faucet.test.near', 'bob.test.near', 'withdraw', { amount: '200' });

    const tokenContract = this.near.getContract('agr-faucet.test.near');
    expect(tokenContract.instance.withdrawals).to.equal(2);
  }
}

@Passes('ok', CODE_02_VALID)
@Fails('empty tests', CODE_02_EMPTY_TESTS, 'Both test cases should have failed, but they did not.')
@Lesson('02-tests')
class Lesson2 extends LessonBase {
  @Test('Should implement test cases in test.ts')
  async test1() {
    // run tests submitted by user
    let workspacesMock = this.createWorkspacesMock(this.files['faucet.ts'].content);
    let testLite = new TestLiteService();
    let userspace = await JavaScriptUserspace.create(this.files);
    userspace.mockModule('near-workspaces', workspacesMock.moduleMock);
    userspace.mockModule('test-lite', testLite.moduleMock);
    await userspace.import('test.ts');
    let res = await testLite.run();
    this.result.tests = this.result.tests.concat(res.tests);
    if (!res.passed) {
      this.result.passed = false;
    }

    // run our tests to check if the user implemented the tests
    workspacesMock = this.createWorkspacesMock(CODE_02_NOOP_CONTRACT);
    testLite = new TestLiteService();
    userspace = await JavaScriptUserspace.create(this.files);
    userspace.mockModule('near-workspaces', workspacesMock.moduleMock);
    userspace.mockModule('test-lite', testLite.moduleMock);
    await userspace.import('test.ts');
    res = await testLite.run();
    expect(res.tests.map(t => t.passed)).to.deep.equal(
      [false, false],
      'Both test cases should have failed, but they did not. Do they test anything?',
    );
  }

  private createWorkspacesMock(contract: string) {
    const workspacesMock = new NearWorkspacesMock();
    workspacesMock.deployables = [
      {
        wasm: 'faucet.wasm',
        source: contract,
      },
      {
        wasm: 'fungible_token.wasm',
        source: FUNGIBLE_TOKEN_CONTRACT,
      },
    ];
    return workspacesMock;
  }
}

@Passes('ok', CODE_03_VALID)
@Lesson('03-callbacks')
class Lesson3 extends LessonBase {
  near: NearSdkMock;

  async beforeEach() {
    this.near = new NearSdkMock();
    this.near.addAccount('agr-faucet.test.near', 10n ** 24n);
    await this.near.deploy('agr-token.test.near', FUNGIBLE_TOKEN_CONTRACT);
    await this.near.deploy('agr-faucet.test.near', this.files['faucet.ts'].content);
    this.near.addAccount('alice.test.near');
    this.near.addAccount('bob.test.near');

    // initialize the fungible token contract
    await this.near.call('agr-token.test.near', 'agr-faucet.test.near', 'new', {
      owner_id: 'agr-faucet.test.near',
      total_supply: '1000',
    });
  }

  @Test('Should increment the withdrawals counter only on success')
  async test1() {
    await this.near.call('agr-faucet.test.near', 'alice.test.near', 'withdraw', { amount: '100' });
    await this.near.call('agr-faucet.test.near', 'alice.test.near', 'withdraw', { amount: '100' });
    let withdrawals = await this.near.view('agr-faucet.test.near', 'get_withdrawals');
    expect(withdrawals).to.equal(2);

    try {
      await this.near.call('agr-faucet.test.near', 'alice.test.near', 'withdraw', {
        amount: '2000',
      });
    } catch (err) {
      // it doesn't matter whether contract call fails or not here
    }

    withdrawals = await this.near.view('agr-faucet.test.near', 'get_withdrawals');
    expect(withdrawals).to.equal(2);
  }

  async afterAll(): Promise<void> {
    const workspacesMock = new NearWorkspacesMock();
    workspacesMock.deployables = [
      {
        wasm: 'faucet.wasm',
        source: this.files['faucet.ts'].content,
      },
      {
        wasm: 'fungible_token.wasm',
        source: FUNGIBLE_TOKEN_CONTRACT,
      },
    ];

    const testLite = new TestLiteService();
    const userspace = await JavaScriptUserspace.create(this.files);
    userspace.mockModule('near-workspaces', workspacesMock.moduleMock);
    userspace.mockModule('test-lite', testLite.moduleMock);
    await userspace.import('test.ts');
    const res = await testLite.run();
    this.result.tests = this.result.tests.concat(res.tests);
    if (!res.passed) {
      this.result.passed = false;
    }
  }
}

@Passes('ok', CODE_04_VALID)
@Lesson('04-chaining')
class Lesson4 extends LessonBase {
  near: NearSdkMock;

  async beforeEach() {
    this.near = new NearSdkMock();
    this.near.addAccount('agr-faucet.test.near', 10n ** 24n);
    await this.near.deploy('agr-token.test.near', FUNGIBLE_TOKEN_CONTRACT);
    await this.near.deploy('agr-faucet.test.near', this.files['faucet.ts'].content);
    this.near.addAccount('alice.test.near');
    this.near.addAccount('bob.test.near');
    this.near.addAccount('carol.test.near');

    // initialize the fungible token contract
    await this.near.call('agr-token.test.near', 'agr-faucet.test.near', 'new', {
      owner_id: 'agr-faucet.test.near',
      total_supply: '1000',
    });
  }

  @Test('Should transfer tokens to three accounts')
  @Fails('joint promise', CODE_04_JOINT_PROMISE, 'Returning joint promise is currently prohibited.')
  async test1() {
    await this.near.call('agr-faucet.test.near', 'agr-faucet.test.near', 'payout', {});

    const { balances } = this.near.getContract('agr-token.test.near').instance;
    expect(balances['alice.test.near']).to.equal(100n, 'Alice should have 100 tokens');
    expect(balances['bob.test.near']).to.equal(100n, 'Bob should have 100 tokens');
    expect(balances['carol.test.near']).to.equal(100n, 'Carol should have 100 tokens');
  }

  @Test('Should add test case')
  async test2() {
    const workspacesMock = new NearWorkspacesMock();
    workspacesMock.deployables = [
      {
        wasm: 'faucet.wasm',
        source: this.files['faucet.ts'].content,
      },
      {
        wasm: 'fungible_token.wasm',
        source: FUNGIBLE_TOKEN_CONTRACT,
      },
    ];

    const testLite = new TestLiteService();
    const userspace = await JavaScriptUserspace.create(this.files);
    userspace.mockModule('near-workspaces', workspacesMock.moduleMock);
    userspace.mockModule('test-lite', testLite.moduleMock);
    await userspace.import('test.ts');
    const res = await testLite.run();

    expect(res.tests.length).to.equal(3, 'There should be 3 test cases in test.ts');

    this.result.tests = this.result.tests.concat(res.tests);
    if (!res.passed) {
      this.result.passed = false;
    }
  }
}

@Passes('ok', CODE_05_VALID)
@Fails(
  'ok',
  CODE_05_INVALID,
  `AssertionError: expected 'Balances: alice - 100, bob - 0, carol - 0' to equal 'Balances: alice - 100, bob - 100, carol - 100'`,
)
@Lesson('05-orphans')
class Lesson5 extends LessonBase {
  near: NearSdkMock;

  async beforeEach() {
    this.near = new NearSdkMock();
    this.near.addAccount('agr-faucet.test.near', 10n ** 24n);
    await this.near.deploy('agr-token.test.near', FUNGIBLE_TOKEN_CONTRACT);
    await this.near.deploy('agr-faucet.test.near', this.files['faucet.ts'].content);
    this.near.addAccount('alice.test.near');
    this.near.addAccount('bob.test.near');
    this.near.addAccount('carol.test.near');

    // initialize the fungible token contract
    await this.near.call('agr-token.test.near', 'agr-faucet.test.near', 'new', {
      owner_id: 'agr-faucet.test.near',
      total_supply: '1000',
    });
  }

  @Test('Should payout 100 tokens to each account')
  async test1() {
    await this.near.call('agr-faucet.test.near', 'agr-faucet.test.near', 'payout', {
      receivers: ['alice.test.near', 'bob.test.near', 'carol.test.near'],
    });

    const { balances } = this.near.getContract('agr-token.test.near').instance;
    const balancesStr = `Balances: alice - ${balances['alice.test.near'] ?? 0n}, bob - ${
      balances['bob.test.near'] ?? 0n
    }, carol - ${balances['carol.test.near'] ?? 0n}`;
    console.debug(balancesStr);
    expect(balancesStr).to.equal('Balances: alice - 100, bob - 100, carol - 100');
  }

  async afterAll() {
    const workspacesMock = new NearWorkspacesMock();
    workspacesMock.deployables = [
      {
        wasm: 'faucet.wasm',
        source: this.files['faucet.ts'].content,
      },
      {
        wasm: 'fungible_token.wasm',
        source: FUNGIBLE_TOKEN_CONTRACT,
      },
    ];

    const testLite = new TestLiteService();
    const userspace = await JavaScriptUserspace.create(this.files);
    userspace.mockModule('near-workspaces', workspacesMock.moduleMock);
    userspace.mockModule('test-lite', testLite.moduleMock);
    await userspace.import('test.ts');
    const res = await testLite.run();

    this.result.tests = this.result.tests.concat(res.tests);
    if (!res.passed) {
      this.result.passed = false;
    }
  }
}

@Passes('ok', CODE_06_VALID)
@Lesson('06-token-swap')
class Lesson6 extends LessonBase {
  @Test('Run tests')
  async test1() {
    const workspacesMock = new NearWorkspacesMock();
    workspacesMock.deployables = [
      {
        wasm: 'swap.wasm',
        source: this.files['swap.ts'].content,
      },
      {
        wasm: 'fungible_token.wasm',
        source: FUNGIBLE_TOKEN_CONTRACT,
      },
    ];

    const testLite = new TestLiteService();
    const userspace = await JavaScriptUserspace.create(this.files);
    userspace.mockModule('near-workspaces', workspacesMock.moduleMock);
    userspace.mockModule('test-lite', testLite.moduleMock);
    await userspace.import('test.ts');
    const res = await testLite.run();

    console.debug('res', res);

    this.result.tests = this.result.tests.concat(res.tests);
    if (!res.passed) {
      this.result.passed = false;
    }
  }
}
