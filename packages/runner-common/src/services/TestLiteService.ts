import { TTestResponse } from '../types';

interface Test {
  title: string;
  fn: () => Promise<void>;
}

export class TestLiteService {
  private tests: Test[] = [];
  private beforeEachFn = async () => {
    /* noop */
  };
  private afterEachFn = async () => {
    /* noop */
  };

  private prevNoColor = '';

  moduleMock = {
    test: this.test.bind(this),
    beforeEach: this.beforeEach.bind(this),
    afterEach: this.afterEach.bind(this),
  };

  test(title: string, fn: () => Promise<void>) {
    this.tests.push({ title, fn });
  }

  beforeEach(fn: () => Promise<void>) {
    this.beforeEachFn = fn;
  }

  afterEach(fn: () => Promise<void>) {
    this.afterEachFn = fn;
  }

  async run(): Promise<TTestResponse> {
    this.prevNoColor = process.env.NO_COLOR ?? '';
    process.env.NO_COLOR = 'true';

    try {
      const res: TTestResponse = {
        passed: true,
        tests: [],
      };

      for (const test of this.tests) {
        try {
          await this.beforeEachFn();
          await test.fn();
          await this.afterEachFn();
          res.tests.push({ title: test.title, passed: true });
        } catch (err) {
          res.passed = false;
          res.tests.push({
            title: test.title,
            passed: false,
            error: err.code ? `[${err.code}]: ${err.message}` : err.message,
          });
        }
      }

      return res;
    } finally {
      if (this.prevNoColor) {
        process.env.NO_COLOR = this.prevNoColor;
      } else {
        delete process.env.NO_COLOR;
      }
    }
  }
}
