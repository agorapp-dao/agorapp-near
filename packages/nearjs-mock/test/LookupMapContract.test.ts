import { expect } from 'chai';
import { createTester, IMockTester, IntegrationTester, MockTester } from '../src/NearSdkMockTester';
import * as chai from 'chai';

chai.config.truncateThreshold = 0;

describe('LookupMapContract', () => {
  const tester = createTester();

  before(async () => {
    await tester.beforeAll();
    await tester.deploy('LookupMapContract');
  });

  after(async () => {
    await tester.afterAll();
  });

  it('get non-existing value', async () => {
    const nr = await tester.view('LookupMapContract', 'get_entry', { key: 'unknown' });
    expect(nr).to.equal(null);
  });

  it('set and get value', async () => {
    await tester.call('alice', 'LookupMapContract', 'set_entry', { key: 'test', value: 42 });
    const nr = await tester.view('LookupMapContract', 'get_entry', { key: 'test' });
    expect(nr).to.equal(42);
  });
});
