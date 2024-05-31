import { NearBindgen as RealNearBindgen, view as realView, call as realCall } from 'near-sdk-js';

export interface NearBindgenOptions {
  requireInit?: boolean;
  serializer?(value: unknown): Uint8Array;
  deserializer?(value: Uint8Array): unknown;
}

export const viewMetaKey = Symbol('view');
export const callMetaKey = Symbol('call');

export type AddContractCallback = (
  contractName: string,
  contractConstructor: new () => unknown,
  options: NearBindgenOptions,
) => void;

export function decoratorsMock(addContractCallback: AddContractCallback) {
  const NearBindgen: typeof RealNearBindgen = function NearBindgen(options: NearBindgenOptions) {
    return function nearBindgenDecorator(constructor: new () => any) {
      addContractCallback(constructor.name, constructor, options);
    };
  };

  const view: typeof realView = function view() {
    return function viewDecorator(target: any, methodName: string, descriptor: PropertyDescriptor) {
      descriptor.value[viewMetaKey] = true;
    };
  };

  const call: typeof realCall = function call(options) {
    return function viewDecorator(target: any, methodName: string, descriptor: PropertyDescriptor) {
      descriptor.value[callMetaKey] = { isCallMethod: true, options };
    };
  };

  return {
    NearBindgen,
    view,
    call,
  };
}
