import { NearBindgen as RealNearBindgen, view as realView, call as realCall } from 'near-sdk-js';
import { NearSdkMock } from '../NearSdkMock';

export interface NearBindgenOptions {
  requireInit?: boolean;
  serializer?(value: unknown): Uint8Array;
  deserializer?(value: Uint8Array): unknown;
}

export const viewMetaKey = Symbol('view');
export const callMetaKey = Symbol('call');

export function decoratorsMock(nearMock: NearSdkMock) {
  const NearBindgen: typeof RealNearBindgen = function NearBindgen(options: NearBindgenOptions) {
    return function nearBindgenDecorator(constructor: new () => any) {
      nearMock.contracts.set(constructor.name, {
        constructor,
        options,
      });
    };
  };

  const view: typeof realView = function view() {
    return function viewDecorator(target: any, methodName: string, descriptor: PropertyDescriptor) {
      descriptor.value[viewMetaKey] = true;
    };
  };

  const call: typeof realCall = function call() {
    return function viewDecorator(target: any, methodName: string, descriptor: PropertyDescriptor) {
      descriptor.value[callMetaKey] = true;
    };
  };

  return {
    NearBindgen,
    view,
    call,
  };
}
