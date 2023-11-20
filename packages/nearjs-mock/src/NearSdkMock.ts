import { expect } from '@agorapp-dao/runner-common';
import { createModuleMock } from './NearSdkMockImpl/module';
import { callMetaKey, NearBindgenOptions, viewMetaKey } from './NearSdkMockImpl/decorators';

interface MethodContext {
  contractName?: string;
  currentMethod?: any;
  signerName?: string;
}

export class NearSdkMock {
  contracts = new Map<string, Contract>();

  // Context of the method that is being executed by the mock
  methodContext: MethodContext = {};

  isViewMethod(method: any) {
    return method[viewMetaKey] === true;
  }

  isCallMethod(method: any) {
    return method[callMetaKey] === true;
  }

  async view(contractName: string, methodName: string, args: any = {}) {
    const instance = this.getContractInstance(contractName);
    const method = instance[methodName];
    if (!method) {
      expect.fail(
        `Method ${methodName} not found on contract ${contractName}. Did you decorate it with @view?`,
      );
    }
    this.methodContext.contractName = contractName;
    this.methodContext.currentMethod = method;
    return method.call(instance, args);
  }

  async call(signerName: string, contractName: string, methodName: string, args: any = {}) {
    const instance = this.getContractInstance(contractName);
    const method = instance[methodName];
    if (!method) {
      expect.fail(
        `Method ${methodName} not found on contract ${contractName}. Did you decorate it with @call?`,
      );
    }
    this.methodContext.contractName = contractName;
    this.methodContext.currentMethod = method;
    this.methodContext.signerName = signerName;
    return method.call(instance, args);
  }

  getContractInstance(contractName: string): any {
    const contract = this.contracts.get(contractName);
    if (!contract) {
      expect.fail(`Contract class ${contractName} not found, is it marked with @NearBindgen?`);
    }
    if (!contract.instance) {
      contract.instance = new contract.constructor();
    }
    return contract.instance;
  }

  moduleMock = createModuleMock(this);
}

interface Contract<T = any> {
  constructor: new () => T;
  instance?: T;
  options: NearBindgenOptions;
}
