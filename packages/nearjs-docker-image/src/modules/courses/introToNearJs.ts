import { NearSdkMock } from '@agorapp-dao/nearjs-mock';
import {
  Action,
  Course,
  CourseBase,
  expect,
  Fails,
  JavaScriptUserspace,
  Lesson,
  LessonBase,
  Passes,
  Test,
} from '@agorapp-dao/runner-common';
import {
  CODE_01_MISSING_NEARBINDGEN,
  CODE_01_MISSING_VIEW,
  CODE_01_VALID,
  CODE_02_VALID,
  CODE_03_BAD_MAP,
  CODE_03_VALID,
  CODE_04_PREDECESSOR,
  CODE_04_VALID,
  CODE_05_VALID,
  CODE_06_VALID,
  CODE_07_VALID,
  CODE_08_VALID,
  CODE_09_VALID,
  CODE_10_VALID,
  CODE_11_VALID,
} from './introToNearJs.code';
import { TActionRequest } from '@agorapp-dao/runner-common/src/types';
import { TRunActionRequest, TRunActionResponse } from '../../types';

interface Context {
  near: NearSdkMock;
  deploy: (accountId: string, fileName?: string) => Promise<void>;
}

@Course('introduction-to-nearjs')
export class IntroToNearJsCourse extends CourseBase<Context> {
  lessons = [
    Lesson1,
    Lesson2,
    Lesson3,
    Lesson4,
    Lesson05,
    Lesson06,
    Lesson07,
    Lesson08,
    Lesson09,
    Lesson10,
    Lesson11,
  ];

  async beforeEach() {
    const near = new NearSdkMock();
    this.context.near = near;
    this.context.deploy = (accountId, fileName = 'contract.ts') =>
      near.deploy(accountId, this.files[fileName].content);
  }

  @Action('run')
  async run(request: TActionRequest<TRunActionRequest>): Promise<TRunActionResponse> {
    const near = new NearSdkMock();

    const { args } = request;
    const { accounts, transactions } = args;

    for (const account of accounts) {
      near.addAccount(account.accountId, BigInt(account.balance));
    }
    this.files['game.ts'] && (await near.deploy('game.near', this.files['game.ts'].content));
    this.files['game-manager.ts'] &&
      (await near.deploy('game-manager.near', this.files['game-manager.ts'].content));

    for (const transaction of transactions) {
      const args: any = {};
      for (const arg of transaction.args) {
        let value;
        switch (arg.type) {
          case 'bigint':
            value = BigInt(arg.value);
            break;
          default:
            value = arg.value;
        }
        args[arg.name] = value;
      }

      await near.call(
        transaction.contract,
        transaction.signer,
        transaction.method,
        args,
        transaction.amount ? { attachedDeposit: BigInt(transaction.amount) } : null,
      );
    }
    for (const account of accounts) {
      account.balance = near.getBalance(account.accountId).toString();
    }

    return { accounts };
  }
}

@Lesson('01-introduction')
@Passes('ok', CODE_01_VALID)
export class Lesson1 extends LessonBase<Context> {
  @Test('Should create a contract class')
  @Fails(
    'missing-nearbindgen',
    CODE_01_MISSING_NEARBINDGEN,
    'Contract class for account account.near not found, is it marked with @NearBindgen?',
  )
  async test1() {
    const { near, deploy } = this.context;

    await deploy('account.near');
    near.getContract('account.near');
  }

  @Test('Should create a view method')
  @Fails(
    'missing-view',
    CODE_01_MISSING_VIEW,
    'Method get_count is not a view method. Did you decorate it with @view?',
  )
  async test() {
    const { near, deploy } = this.context;
    await deploy('account.near');

    near.view('account.near', 'get_count');
  }
}

@Lesson('02-state')
@Passes('ok', CODE_02_VALID)
export class Lesson2 extends LessonBase<Context> {
  @Test('Should create a state variable')
  async test1() {
    const { near, deploy } = this.context;
    await deploy('account.near');
    const contract = near.getContract('account.near');

    expect(contract.instance.count, 'Property count does not exist').to.exist;
    expect(contract.instance.count).to.equal(0, 'Property count should be initialized to 0');
  }

  @Test('Should add increment method')
  async test2() {
    const { near, deploy } = this.context;
    near.addAccount('account.near', 1_000_000_000n);
    near.addAccount('bob.near', 1_000_000_000n);
    await deploy('account.near');
    await near.call('account.near', 'bob.near', 'increment');
  }

  @Test('get_count should return the value of counter')
  async test3() {
    const { near, deploy } = this.context;
    near.addAccount('account.near', 1_000_000_000n);
    near.addAccount('bob.near', 1_000_000_000n);
    await deploy('account.near');

    await near.call('account.near', 'bob.near', 'increment');
    await near.call('account.near', 'bob.near', 'increment');

    const count = near.view('account.near', 'get_count');
    expect(count).to.equal(2);
  }
}

@Lesson('03-collections')
@Passes('ok', CODE_03_VALID)
export class Lesson3 extends LessonBase<Context> {
  @Test('Should add state variable `counters`')
  @Fails(
    'bad map type used',
    CODE_03_BAD_MAP,
    'Property counters should be an instance of LookupMap',
  )
  async test1() {
    const { near, deploy } = this.context;
    await deploy('account.near');

    const contract = near.getContract('account.near');
    const instance = new contract.constructor();

    expect(instance.counters, 'Property counters does not exist').to.exist;
    expect(instance.counters).to.be.instanceOf(
      this.context.near.moduleMock.LookupMap,
      'Property counters should be an instance of LookupMap',
    );
    expect(instance.counters.keyPrefix, 'LookupMap should have a key prefix set.').to.not.be.empty;
  }

  @Test('Should modify `get_count` to accept key parameter')
  async test2() {
    const { near, deploy } = this.context;
    near.addAccount('account.near', 1_000_000_000n);
    near.addAccount('bob.near', 1_000_000_000n);
    await deploy('account.near');
    await near.call('account.near', 'bob.near', 'increment', { key: 'test-key' });
    await near.call('account.near', 'bob.near', 'increment', { key: 'test-key' });
    await near.call('account.near', 'bob.near', 'increment', { key: 'test-key' });

    expect(near.view('account.near', 'get_count', { key: 'test-key' })).to.equal(3);
    expect(near.view('account.near', 'get_count', { key: 'unknown-key' })).to.equal(
      0,
      'Should return 0 for unknown key',
    );
  }

  @Test('Should modify `increment` to accept key parameter')
  async test3() {
    const { near, deploy } = this.context;
    near.addAccount('account.near', 1_000_000_000n);
    near.addAccount('bob.near', 1_000_000_000n);
    await deploy('account.near');

    await near.call('account.near', 'bob.near', 'increment', { key: 'test-key1' });
    await near.call('account.near', 'bob.near', 'increment', { key: 'test-key1' });
    await near.call('account.near', 'bob.near', 'increment', { key: 'test-key2' });

    expect(near.view('account.near', 'get_count', { key: 'test-key1' })).to.equal(2);
    expect(near.view('account.near', 'get_count', { key: 'test-key2' })).to.equal(1);
  }
}

@Lesson('04-environment')
@Passes('ok', CODE_04_VALID)
export class Lesson4 extends LessonBase<Context> {
  @Test("Method `increment` should increment the user's personal counter")
  @Fails(
    'predecessor',
    CODE_04_PREDECESSOR,
    'Counter value for the user that initiated transaction should be 2',
  )
  async test1() {
    const { near, deploy } = this.context;
    near.addAccount('account.near', 1_000_000_000n);
    near.addAccount('bob.near', 1_000_000_000n);

    await deploy('account.near');

    await near.call(
      'account.near',
      { signer: 'account.near', predecessor: 'bob.near' },
      'increment',
    );
    await near.call(
      'account.near',
      { signer: 'account.near', predecessor: 'bob.near' },
      'increment',
    );

    expect(near.view('account.near', 'get_count', { key: 'bob.near' })).to.equal(
      0,
      'Do not use predecessorAccount, it might not identify the real initiator of the transaction',
    );
    expect(near.view('account.near', 'get_count', { accountId: 'account.near' })).to.equal(
      2,
      'Counter value for the user that initiated transaction should be 2',
    );
  }

  @Test('Method `get_value` should accept accountId parameter')
  async test2() {
    const { near, deploy } = this.context;
    near.addAccount('account.near', 1_000_000_000n);
    near.addAccount('alice.near', 1_000_000_000n);

    await deploy('account.near');

    await near.call('account.near', 'account.near', 'increment');
    await near.call('account.near', 'alice.near', 'increment');
    await near.call('account.near', 'alice.near', 'increment');

    expect(near.view('account.near', 'get_count', { accountId: 'account.near' })).to.equal(1);
    expect(near.view('account.near', 'get_count', { accountId: 'alice.near' })).to.equal(2);
  }
}

@Lesson('05-payable-methods')
@Passes('ok', CODE_05_VALID)
export class Lesson05 extends LessonBase<Context> {
  @Test('Method `join` should be marked as payable')
  async test() {
    const { near, deploy } = this.context;
    near.addAccount('bob.near', 4_000_000n);

    await deploy('game.near', 'game.ts');

    await near.call('game.near', 'bob.near', 'join', {}, { attachedDeposit: 1_000_000n });

    expect(near.__lastMethodContext.signerAccountId).to.equal('bob.near');
    expect(near.__lastMethodContext.attachedDeposit).to.equal(
      1_000_000n,
      'Deposit should be exactly `1,000,000` yoctoNEAR to join the game',
    );
  }

  @Test('Method `join` should accept exactly 1,000,000 yoctoNEAR')
  async test1() {
    const { near, deploy } = this.context;
    near.addAccount('bob.near', 4_000_000n);
    near.addAccount('alice.near', 5_000_000n);
    near.addAccount('tom.near', 1_000_000n);

    await deploy('game.near', 'game.ts');

    await near.call('game.near', 'alice.near', 'join', {}, { attachedDeposit: 1_000_000n });
    await near.call('game.near', 'tom.near', 'join', {}, { attachedDeposit: 1_000_000n });

    expect(
      () => near.call('game.near', 'bob.near', 'join'),
      'You must send exactly 1,000,000 yoctoNEAR to join the game',
    ).to.throw('Join fee is 1,000,000 yoctoNEAR');
    expect(
      () => near.call('game.near', 'bob.near', 'join', {}, { attachedDeposit: 0n }),
      'You must send exactly 1,000,000 yoctoNEAR to join the game',
    ).to.throw('Join fee is 1,000,000 yoctoNEAR');

    expect(
      () => near.call('game.near', 'bob.near', 'join', {}, { attachedDeposit: 2_000_000n }),
      'You must send exactly 1,000,000 yoctoNEAR to join the game',
    ).to.throw('Join fee is 1,000,000 yoctoNEAR');

    expect(near.getBalance('game.near')).to.equal(
      2_000_000n,
      'Game contract should hold 3,000,000 yoctoNEAR tokens after 3 players joined the game',
    );
    expect(near.getBalance('bob.near')).to.equal(
      4_000_000n,
      'bob.near should have his 4,000,000 yoctoNEAR tokens as he did not join the game',
    );
    expect(near.getBalance('alice.near')).to.equal(
      4_000_000n,
      'alice.near should have 4,000,000 yoctoNEAR tokens after joining the game',
    );
    expect(near.getBalance('tom.near')).to.equal(
      0n,
      'tom.near should have 0 yoctoNEAR tokens after joining the game',
    );
  }
}

@Lesson('06-sending-native-tokens')
@Passes('ok', CODE_06_VALID)
export class Lesson06 extends LessonBase<Context> {
  @Test('Should transfer all contract tokens to the winner')
  async test() {
    const { near, deploy } = this.context;
    near.addAccount('bob.near', 4_000_000n);
    near.addAccount('alice.near', 5_000_000n);
    near.addAccount('tom.near', 1_000_000n);

    near.addAccount('game.near');
    await deploy('game.near', 'game.ts');

    await near.call('game.near', 'bob.near', 'join', {}, { attachedDeposit: 1_000_000n });
    await near.call('game.near', 'alice.near', 'join', {}, { attachedDeposit: 1_000_000n });
    await near.call('game.near', 'tom.near', 'join', {}, { attachedDeposit: 1_000_000n });

    expect(near.getBalance('game.near')).to.equal(
      3_000_000n,
      '3 players joined the game and game contract should hold 3,000,000 yoctoNEAR tokens',
    );

    await near.call('game.near', 'game.near', 'play');

    expect(near.getBalance('bob.near')).to.equal(
      3_000_000n,
      'bob.near joined the game and his balance should be 3,000,000 yoctoNEAR tokens after joining',
    );
    expect(near.getBalance('alice.near')).to.equal(
      4_000_000n,
      'alice.near joined the game and her balance should be 4,000,000 yoctoNEAR tokens after joining',
    );
    expect(near.getBalance('tom.near')).to.equal(
      3_000_000n,
      'tom.near joined the game and He wins so his balance should be 3,000,000 yoctoNEAR tokens after joining and after winning the game',
    );
    expect(near.getBalance('game.near')).to.equal(0n, 'Game contract should be drained');
  }
}

@Lesson('07-promises')
@Passes('ok', CODE_07_VALID)
export class Lesson07 extends LessonBase<Context> {
  @Test('Should abort the game and return all tokens to players')
  async test() {
    const { near, deploy } = this.context;
    near.addAccount('bob.near', 4_000_000n);
    near.addAccount('alice.near', 5_000_000n);

    near.addAccount('game.near');
    await deploy('game.near', 'game.ts');

    await near.call('game.near', 'bob.near', 'join', {}, { attachedDeposit: 1_000_000n });
    expect(near.getBalance('bob.near')).to.equal(
      3_000_000n,
      'bob.near should have 3,000,000 yoctoNEAR tokens after joining the game',
    );

    await near.call('game.near', 'alice.near', 'join', {}, { attachedDeposit: 1_000_000n });
    expect(near.getBalance('alice.near')).to.equal(
      4_000_000n,
      'alice.near should have 4,000,000 yoctoNEAR tokens after joining the game',
    );

    await near.call('game.near', 'bob.near', 'abort');

    expect(near.getBalance('bob.near')).to.equal(
      4_000_000n,
      'bob.near should have 4,000,000 yoctoNEAR tokens after the game is aborted',
    );
    expect(near.getBalance('alice.near')).to.equal(
      5_000_000n,
      'alice.near should have 5,000,000 yoctoNEAR tokens after the game is aborted',
    );
  }
}

@Lesson('08-cross-contract-calls')
@Passes('ok', CODE_08_VALID)
export class Lesson08 extends LessonBase<Context> {
  @Test('GameManager should call `play` method')
  async test() {
    const { near, deploy } = this.context;
    near.addAccount('bob.near', 4_000_000n);
    near.addAccount('alice.near', 5_000_000n);

    near.addAccount('game.near');
    near.addAccount('game-manager.near');
    await deploy('game.near', 'game.ts');
    await deploy('game-manager.near', 'game-manager.ts');

    await near.call('game.near', 'bob.near', 'join', {}, { attachedDeposit: 1_000_000n });
    await near.call('game.near', 'alice.near', 'join', {}, { attachedDeposit: 1_000_000n });
    await near.call('game-manager.near', 'game-manager.near', 'execute', {
      gameAccountId: 'game.near',
    });

    expect(near.getBalance('game.near')).to.equal(
      0n,
      'game.near contract should have been drained, was play method really called?',
    );
  }

  @Test('Access to `play` method should be restricted')
  async test2() {
    const { near, deploy } = this.context;

    near.addAccount('alice.near', 5_000_000n);
    near.addAccount('game.near');
    near.addAccount('game-manager.near');
    near.addAccount('game-manager-operator.near');
    await deploy('game.near', 'game.ts');
    await deploy('game-manager.near', 'game-manager.ts');

    expect(
      () =>
        near.call(
          'game.near',
          { signer: 'game-manager-operator.near', predecessor: 'game-manager.near' },
          'play',
        ),
      'GameManager should be able to call the play method. Make sure to use the predecessor account to check the caller',
    ).to.not.throw;

    expect(
      () => near.call('game.near', 'alice.near', 'play'),
      'Alice should not be able to call the play method.',
    ).to.throw('Unauthorized');
  }
}

@Lesson('09-callbacks')
@Passes('ok', CODE_09_VALID)
export class Lesson09 extends LessonBase<Context> {
  @Test('Should add `play_callback` method')
  async test1() {
    const { near, deploy } = this.context;
    near.addAccount('alice.near');
    await deploy('game-manager.near', 'game-manager.ts');

    await near.call('game-manager.near', 'game-manager.near', 'play_callback', {
      gameAccountId: 'game.near',
    });

    expect(
      () => near.call('game-manager.near', 'alice.near', 'play_callback'),
      'Callback method should be callable only by the GameManager contract',
    ).to.throw('Method play_callback is private and can only be called by the contract itself');
  }

  @Test('Should increment `gamesPlayed` state variable after successful `play` call')
  async test2() {
    const { near, deploy } = this.context;
    near.addAccount('alice.near', 1_000_000n);
    await deploy('game.near', 'game.ts');
    await deploy('game-manager.near', 'game-manager.ts');

    await near.call('game.near', 'alice.near', 'join', {}, { attachedDeposit: 1_000_000n });

    const { instance } = near.getContract('game-manager.near');
    expect(instance.gamesPlayed).to.equal(0, 'gamesPlayed should be initialized to 0');

    await near.call('game-manager.near', 'game-manager.near', 'execute', {
      gameAccountId: 'game.near',
    });
    expect(instance.gamesPlayed).to.equal(
      1,
      'gamesPlayed should be incremented after a successful play call',
    );
  }
}

@Lesson('10-create-deploy')
@Passes('ok', CODE_10_VALID)
export class Lesson10 extends LessonBase<Context> {
  @Test('Should create a subaccount')
  async test1() {
    const { near, deploy } = this.context;
    near.addAccount('game-manager.near', BigInt(Math.pow(10, 24)) * 5n);
    await deploy('game.near', 'game.ts');
    await deploy('game-manager.near', 'game-manager.ts');

    await near.call('game-manager.near', 'game-manager.near', 'start');

    const subaccount = Object.keys(near.accounts)[2];
    expect(subaccount).to.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.game\.near$/,
      'Subaccount id should be created with the format `random-uuid.game.near',
    );

    console.debug(near.accounts);
  }

  @Test('Should transfer 5 NEAR tokens to the subaccount')
  async test2() {
    const { near, deploy } = this.context;
    near.addAccount('game-manager.near', BigInt(Math.pow(10, 24)) * 5n);
    await deploy('game.near', 'game.ts');
    await deploy('game-manager.near', 'game-manager.ts');

    await near.call('game-manager.near', 'game-manager.near', 'start');

    const subaccount = Object.values(near.accounts)[2];
    expect(subaccount.balance).to.equal(
      BigInt(Math.pow(10, 24)) * 5n,
      'Subaccount should have 5 NEAR tokens',
    );
  }

  @Test('Should deploy game contract to the subaccount')
  async test3() {
    const { near, deploy } = this.context;
    near.addAccount('game-manager.near', BigInt(Math.pow(10, 24)) * 5n);
    await deploy('game.near', 'game.ts');
    await deploy('game-manager.near', 'game-manager.ts');

    await near.call('game-manager.near', 'game-manager.near', 'start');
    expect(near.promiseDeployCalls.length).to.equal(1, 'Contract was not deployed');
    expect(near.promiseDeployCalls[0].wasm.toString()).to.equal(
      'test wasm',
      'Invalid wasm deployed',
    );
    expect(near.promiseDeployCalls[0].accountId).to.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.game\.near$/,
      'Contract deployed to wrong account',
    );
  }
}

@Lesson('11-testnet')
@Passes('ok', CODE_11_VALID)
export class Lesson11 extends LessonBase<Context> {
  @Test('Should get secret from the testnet')
  async test() {
    const userspace = await JavaScriptUserspace.create(this.files);

    const secret = await userspace.import('secret.ts');
    if (!secret?.secret.includes('NEAR is awesome!')) {
      expect.fail('Wrong secret');
    }
  }
}
