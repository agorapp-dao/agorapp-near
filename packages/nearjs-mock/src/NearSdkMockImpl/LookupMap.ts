import { LookupMap as RealLookupMap } from 'near-sdk-js';
import { NearSdkMock } from '../NearSdkMock';
import { GetOptions } from 'near-sdk-js/lib/types/collections';

export function lookupMapMock(nearMock: NearSdkMock) {
  class LookupMap<T> implements RealLookupMap<T> {
    map = new Map<string, T>();

    constructor(keyPrefix: string) {
      this.keyPrefix = keyPrefix;
    }

    containsKey(key: string): boolean {
      return this.map.has(key);
    }

    extend(keyValuePairs: [string, T][], options: GetOptions<T> | undefined): void {
      throw new Error('Not implemented in the mock');
    }

    get(key: string, options: Omit<GetOptions<T>, 'serializer'> | undefined): T | null {
      const res = this.map.get(key);
      if (res == undefined) {
        return null;
      }
      return res;
    }

    readonly keyPrefix: string;

    remove(key: string, options: Omit<GetOptions<T>, 'serializer'> | undefined): T | null {
      const value = this.get(key, options);
      if (value) {
        this.map.delete(key);
      }
      return value;
    }

    serialize(options: Pick<GetOptions<T>, 'serializer'> | undefined): Uint8Array {
      return undefined;
    }

    set(key: string, newValue: T, options: GetOptions<T> | undefined): T | null {
      this.map.set(key, newValue);
      return newValue;
    }
  }

  return { LookupMap };
}
