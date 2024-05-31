import { expect } from 'chai';
import { TestLiteService } from './TestLiteService';
import * as assert from 'node:assert';

describe('TestLiteService', () => {
  it('passes', async () => {
    const testLite = new TestLiteService();
    const { test } = testLite.moduleMock;

    test('test1', async () => {
      assert.equal(1 + 1, 2);
    });

    test('test2', async () => {
      assert.equal(1 + 1, 2);
    });

    const res = await testLite.run();
    expect(res).to.deep.equal({
      passed: true,
      tests: [
        { title: 'test1', passed: true },
        { title: 'test2', passed: true },
      ],
    });
  });

  it('equal fails', async () => {
    const testLite = new TestLiteService();
    const { test } = testLite.moduleMock;

    test('test1', async () => {
      assert.equal(1, 2);
    });

    const res = await testLite.run();
    expect(res).to.deep.equal({
      passed: false,
      tests: [{ title: 'test1', passed: false, error: '[ERR_ASSERTION]: 1 == 2' }],
    });
  });

  it('custom assert message', async () => {
    const testLite = new TestLiteService();
    const { test } = testLite.moduleMock;

    test('test1', async () => {
      assert.equal(1, 2, 'custom error message');
    });

    const res = await testLite.run();
    expect(res).to.deep.equal({
      passed: false,
      tests: [{ title: 'test1', passed: false, error: '[ERR_ASSERTION]: custom error message' }],
    });
  });

  it('assert rejects ok', async () => {
    const testLite = new TestLiteService();
    const { test } = testLite.moduleMock;

    test('test1', async () => {
      await assert.rejects(
        async () => {
          throw new Error('My test error');
        },
        { message: /My test/ },
      );
    });

    const res = await testLite.run();
    expect(res).to.deep.equal({
      passed: true,
      tests: [{ title: 'test1', passed: true }],
    });
  });

  it('assert rejects fail', async () => {
    const testLite = new TestLiteService();
    const { test } = testLite.moduleMock;

    test('test1', async () => {
      await assert.rejects(
        async () => {
          throw new Error('My test error');
        },
        { message: /xxx/ },
      );
    });

    const res = await testLite.run();
    expect(res).to.deep.equal({
      passed: false,
      tests: [
        {
          title: 'test1',
          passed: false,
          error:
            "[ERR_ASSERTION]: Expected values to be strictly deep-equal:\n+ actual - expected\n\n  Comparison {\n+   message: 'My test error'\n-   message: /xxx/\n  }",
        },
      ],
    });
  });
});
