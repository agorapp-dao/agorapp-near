import { near as realNear } from 'near-sdk-js';
import { NearSdkMock } from '../NearSdkMock';
import _ from 'lodash';

export function environmentMock(nearMock: NearSdkMock) {
  type INearEnvironment = typeof realNear;

  class NearEnvironment
    implements
      Pick<
        INearEnvironment,
        'signerAccountId' | 'predecessorAccountId' | 'currentAccountId' | 'log'
      >
  {
    __mock = {
      singerAccountId: '',
      predecessorAccountId: '',
    };

    log(...params: unknown[]): void {
      // do nothing
    }
    /**
     * Returns the account ID of the account that signed the transaction.
     * Can only be called in a call or initialize function.
     */
    signerAccountId(): string {
      if (nearMock.isViewMethod(nearMock.methodContext.currentMethod)) {
        throw new Error(
          `FunctionCallError(HostError(ProhibitedInView { method_name: "signer_account_id" }))`,
        );
      }
      return this.__mock.singerAccountId || `${nearMock.methodContext.signerName}.test.near`;
    }

    /**
     * Returns the account ID of the account that called the function.
     * Can only be called in a call or initialize function.
     */
    predecessorAccountId(): string {
      if (nearMock.isViewMethod(nearMock.methodContext.currentMethod)) {
        throw new Error(
          `FunctionCallError(HostError(ProhibitedInView { method_name: "predecessor_account_id" }))`,
        );
      }
      return this.__mock.predecessorAccountId || `${nearMock.methodContext.signerName}.test.near`;
    }

    currentAccountId(): string {
      return `${_.kebabCase(nearMock.methodContext.contractName)}.test.near`;
    }
  }

  return { near: new NearEnvironment() };
}
