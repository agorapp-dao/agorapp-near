import { NearSdkMock } from '@agorapp-dao/nearjs-mock';
import {
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
} from './introToNearJs.code';

interface Context {
  userspace: JavaScriptUserspace;
  near: NearSdkMock;
}

@Course('introduction-to-nearjs')
export class IntroToNearJsCourse extends CourseBase<Context> {
  lessons = [Lesson1, Lesson2, Lesson3, Lesson4];

  async beforeAll() {
    this.context.userspace = await JavaScriptUserspace.create(this.files);
  }

  async beforeEach() {
    this.context.userspace.invalidateRequireCache();
    this.context.near = new NearSdkMock();
    this.context.userspace.mockModule('near-sdk-js', this.context.near.moduleMock);
    await this.context.userspace.import('contract.ts');
  }
}

@Lesson('01-introduction')
@Passes('ok', CODE_01_VALID)
export class Lesson1 extends LessonBase<Context> {
  @Test('Should create a contract class')
  @Fails(
    'missing-nearbindgen',
    CODE_01_MISSING_NEARBINDGEN,
    'Contract class Counter not found, is it marked with @NearBindgen?',
  )
  async test1() {
    const { near } = this.context;

    near.getContractInstance('Counter');
  }

  @Test('Should create a view method')
  @Fails('missing-view', CODE_01_MISSING_VIEW, 'Method get_count should be decorated with @view')
  async test() {
    const { near } = this.context;
    const instance = near.getContractInstance('Counter');

    expect(instance.get_count, 'Method get_count should be defined on the contract').to.exist;
    expect(near.isViewMethod(instance.get_count)).to.equal(
      true,
      'Method get_count should be decorated with @view',
    );
  }
}

@Lesson('02-state')
@Passes('ok', CODE_02_VALID)
export class Lesson2 extends LessonBase<Context> {
  @Test('Should create a state variable')
  async test1() {
    const { near } = this.context;
    const instance = near.getContractInstance('Counter');

    expect(instance.count, 'Property count does not exist').to.exist;
    expect(instance.count).to.equal(0, 'Property count should be initialized to 0');
  }

  @Test('Should add increment method')
  async test2() {
    const { near } = this.context;
    const instance = near.getContractInstance('Counter');

    expect(instance.increment, 'Method increment should be defined on the contract').to.exist;
    expect(near.isCallMethod(instance.increment)).to.equal(
      true,
      'Method increment should be decorated with @call',
    );
  }

  @Test('get_count should return the value of counter')
  async test3() {
    const { near } = this.context;

    await near.call('alice', 'Counter', 'increment');
    await near.call('alice', 'Counter', 'increment');

    const count = await near.view('Counter', 'get_count');
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
    const { near } = this.context;
    const instance = near.getContractInstance('Counter');
    expect(instance.counters, 'Property counters does not exist').to.exist;
    expect(instance.counters).to.be.instanceOf(
      this.context.near.moduleMock.LookupMap,
      'Property counters should be an instance of LookupMap',
    );
    expect(instance.counters.keyPrefix, 'LookupMap should have a key prefix set.').to.not.be.empty;
  }

  @Test('Should modify `get_count` to accept key parameter')
  async test2() {
    const { near } = this.context;
    const instance = near.getContractInstance('Counter');
    // add one testing key
    instance.counters.set('test-key', 42);

    expect(await near.view('Counter', 'get_count', { key: 'test-key' })).to.equal(42);
    expect(await near.view('Counter', 'get_count', { key: 'unknown-key' })).to.equal(
      0,
      'Should return 0 for unknown key',
    );
  }

  @Test('Should modify `increment` to accept key parameter')
  async test3() {
    const { near } = this.context;

    await near.call('alice', 'Counter', 'increment', { key: 'test-key1' });
    await near.call('alice', 'Counter', 'increment', { key: 'test-key1' });
    await near.call('alice', 'Counter', 'increment', { key: 'test-key2' });

    expect(await near.view('Counter', 'get_count', { key: 'test-key1' })).to.equal(2);
    expect(await near.view('Counter', 'get_count', { key: 'test-key2' })).to.equal(1);
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
    const { near } = this.context;
    near.moduleMock.near.__mock.singerAccountId = 'signer.test.near';
    near.moduleMock.near.__mock.predecessorAccountId = 'predecessor.test.near';
    await near.call(null, 'Counter', 'increment');
    await near.call(null, 'Counter', 'increment');

    expect(await near.view('Counter', 'get_count', { key: 'predecessor.test.near' })).to.equal(
      0,
      'Do not use predecessorAccount, it might not identify the real initiator of the transaction',
    );
    expect(await near.view('Counter', 'get_count', { accountId: 'signer.test.near' })).to.equal(
      2,
      'Counter value for the user that initiated transaction should be 2',
    );
  }

  @Test('Method `get_value` should accept accountId parameter')
  async test2() {
    const { near } = this.context;
    const instance = near.getContractInstance('Counter');
    instance.counters.set('signer.test.near', 42);

    expect(await near.view('Counter', 'get_count', { accountId: 'signer.test.near' })).to.equal(42);
  }
}
