import { expect } from 'chai';
import { createTester, IMockTester, IntegrationTester, MockTester } from '../src/NearSdkMockTester';
import * as chai from 'chai';

chai.config.truncateThreshold = 0;

describe('MethodContract', () => {
  const tester = createTester();

  before(async () => {
    await tester.beforeAll();
    await tester.deploy('MethodContract');
  });

  after(async () => {
    await tester.afterAll();
  });

  it('invoke view method', async () => {
    const res = await tester.view('MethodContract', 'invoke_view');
    expect(res).to.equal('Hello, world!');
  });

  it('invoke view method with args', async () => {
    const res = await tester.view('MethodContract', 'invoke_view_with_args', { test: 'test' });
    expect(res).to.equal('test');
  });

  it.skip('invoke view method with wrong args', async () => {
    const res = await tester.view('MethodContract', 'invoke_view_with_args', { testik: null });
    expect(res).to.equal('');
  });

  it('invoke non-existing method', async () => {
    try {
      await tester.view('MethodContract', 'unknown_method');
      expect.fail('Should have failed');
    } catch (err) {
      if (tester.isMock) {
        expect(err.message).to.include(
          'Method unknown_method not found on contract MethodContract. Did you decorate it with @view?',
        );
      } else {
        expect(err.message).to.include('FunctionCallError(MethodResolveError(MethodNotFound))');
      }
    }
  });
});
