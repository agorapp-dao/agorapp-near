import { expect } from 'chai';
import { createTester, IMockTester, IntegrationTester, MockTester } from '../src/NearSdkMockTester';
import * as chai from 'chai';

chai.config.truncateThreshold = 0;

describe('EnvironmentContract', () => {
  const tester = createTester();

  before(async () => {
    await tester.beforeAll();
    await tester.deploy('EnvironmentContract');
  });

  after(async () => {
    await tester.afterAll();
  });

  it('currentAccountId', async () => {
    const accountId = await tester.view('EnvironmentContract', 'get_currentAccountId');
    expect(accountId).to.equal('environment-contract.test.near');
  });

  it('signerAccountId', async () => {
    await tester.call('alice', 'EnvironmentContract', 'call_setSignerAccountIdState');
    const accountId = await tester.view('EnvironmentContract', 'get_signerAccountIdState');
    expect(accountId).to.equal('alice.test.near');
  });

  it('signerAccountId cannot be called in view method', async () => {
    try {
      await tester.view('EnvironmentContract', 'get_signerAccountId');
      expect.fail('Should not be able to call signerAccountId in view method');
    } catch (err) {
      expect(err.message).to.include(
        'FunctionCallError(HostError(ProhibitedInView { method_name: "signer_account_id" }))',
      );
    }
  });

  it('predecessorAccountId', async () => {
    await tester.call('alice', 'EnvironmentContract', 'call_setPredecessorAccountIdState');
    const accountId = await tester.view('EnvironmentContract', 'get_predecessorAccountIdState');
    expect(accountId).to.equal('alice.test.near');
  });

  it('predecessorAccountId cannot be called in view method', async () => {
    try {
      await tester.view('EnvironmentContract', 'get_predecessorAccountId');
      expect.fail('Should not be able to call predecessorAccountId in view method');
    } catch (err) {
      expect(err.message).to.include(
        'FunctionCallError(HostError(ProhibitedInView { method_name: "predecessor_account_id" }))',
      );
    }
  });
});
