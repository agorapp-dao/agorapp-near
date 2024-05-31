export const testLiteTypes: { [path: string]: string } = {
  'node_modules/test-lite/package.json': `
     {
      "name": "test-lite",
      "version": "0.0.1",
      "main": "./index.js",
      "types": "./index.d.ts",
      "files": [
        "dist"
      ]
    }
  `,
  'node_modules/test-lite/index.d.ts': `
    export declare function test(title: string, fn: () => Promise<void>): void;
    export declare function beforeEach(fn: () => Promise<void>): void;
    export declare function afterEach(fn: () => Promise<void>): void;
  `,
};
