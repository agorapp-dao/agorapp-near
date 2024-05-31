import { AddContractCallback, decoratorsMock } from './decorators';
import { near, LookupMap, NearPromise } from 'near-sdk-js';

export function createModuleMock({
  addContractCallback,
}: {
  addContractCallback: AddContractCallback;
}) {
  return {
    near,
    LookupMap,
    NearPromise,
    includeBytes: (filePath: string): Uint8Array => new TextEncoder().encode('test wasm'),
    ...decoratorsMock(addContractCallback),
  };
}
