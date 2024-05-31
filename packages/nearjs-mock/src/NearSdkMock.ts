import _ from 'lodash';
import { expect, JavaScriptUserspace } from '@agorapp-dao/runner-common';
import { createModuleMock } from './NearSdkMock/module';
import { callMetaKey, NearBindgenOptions, viewMetaKey } from './NearSdkMock/decorators';
import { StorageMock } from './NearSdkMock/storage';
import { deserialize, NearAmount, NearPromise, serialize, Transfer } from 'near-sdk-js';
import { EnvironmentMock } from './NearSdkMock/environment';

export interface Contract<T = any> {
  name: string;
  constructor: new () => T;
  instance?: T;
  options: NearBindgenOptions;
  storage: StorageMock;
}

export interface Account {
  id: string;
  balance: bigint;
}

interface MethodContext {
  contract?: Contract;
  currentMethod?: any;
  /**
   * Account ID of the contract on which the method is invoked
   */
  contractAccountId?: string;
  /**
   * User's account ID that initiated and signed the transaction
   */
  signerAccountId?: string;
  /**
   * Account ID (user or smart contract) that called the method
   */
  predecessorAccountId?: string;

  attachedDeposit?: bigint;

  promises?: PromiseMock[];
}

export interface PromiseMock {
  accountId: string;
  actions: PromiseAction[];
  result?: string | Error;
}

export interface PromiseAction {
  fn: () => Promise<string>;
  type: 'transfer' | 'functionCall';
  amount?: NearAmount;
}

export class NearSdkMock {
  private contracts = new Map<Account['id'], Contract>();
  accounts: { [accountId: string]: Account } = {};
  private environment = new EnvironmentMock(this);
  // TODO:
  promiseDeployCalls: { accountId: Account['id']; wasm: string }[] = [];

  // Context of the method that is being executed by the mock
  methodContext: MethodContext = {};

  promises: { [accountId: string]: PromiseMock[] } = {};

  // for tests
  __lastMethodContext: MethodContext = {};

  constructor() {
    // override wasm host environment used by near-sdk-js
    (globalThis as any).env = this.environment;
  }

  view(accountId: string, methodName: string, args: any = {}) {
    const contract = this.getContract(accountId);
    if (!contract) {
      expect.fail(`Contract for account ${accountId} not found, have you deployed it yet?`);
    }

    this.deserialize(contract);

    const method = contract.instance[methodName];
    if (!method) {
      expect.fail(`Method ${methodName} not found. Did you decorate it with @view?`);
    }

    if (!this.isViewMethod(method)) {
      expect.fail(`Method ${methodName} is not a view method. Did you decorate it with @view?`);
    }

    this.environment.reset();
    this.methodContext.contractAccountId = accountId;
    this.methodContext.contract = contract;
    this.methodContext.currentMethod = method;
    return method.call(contract.instance, args);
  }

  /**
   * Invokes the call method on the contract.
   * @param {string} accountId
   * @param {string | {signer: string, predecessor: string}} caller    Account of the caller. If string is provided, it will be used for both the signer and predecessor.
   * @param {string} methodName
   * @param args
   * @param {{amount?: NearAmount}} options
   */
  call(
    accountId: string,
    caller: string | { signer: string; predecessor: string },
    methodName: string,
    args: any = {},
    options?: {
      attachedDeposit?: bigint;
    },
  ): Promise<any> {
    const contract = this.getContract(accountId);
    if (!contract) {
      expect.fail(`Contract for account ${accountId} not found, have you deployed it yet?`);
    }

    this.deserialize(contract);

    const methodContext: MethodContext = {
      signerAccountId: typeof caller === 'string' ? caller : caller.signer,
      predecessorAccountId: typeof caller === 'string' ? caller : caller.predecessor,
    };

    this.checkAccountExists(methodContext.signerAccountId);
    this.checkAccountExists(methodContext.predecessorAccountId);

    const method = contract.instance[methodName];
    if (!method) {
      expect.fail(`Method ${methodName} not found. Did you decorate it with @call?`);
    }

    if (!this.isCallMethod(method)) {
      expect.fail(`Method ${methodName} is not a call method.  Did you decorate it with @call?`);
    }

    const methodOptions = method[callMetaKey]?.options;

    if (options?.attachedDeposit && !methodOptions?.payableFunction) {
      expect.fail(
        `Method ${methodName} is not payable. Did you decorate it with @call({ payableFunction: true })?`,
      );
    }

    if (methodOptions?.privateFunction && methodContext.predecessorAccountId !== accountId) {
      expect.fail(`Method ${methodName} is private and can only be called by the contract itself`);
    }

    this.environment.reset();
    methodContext.contractAccountId = accountId;
    methodContext.contract = contract;
    methodContext.currentMethod = method;
    methodContext.attachedDeposit = options?.attachedDeposit;
    methodContext.promises = [];

    this.methodContext = methodContext;
    this.__lastMethodContext = methodContext;

    // run synchronous part of the method
    let result: unknown;
    try {
      result = method.call(contract.instance, args);

      if (result instanceof NearPromise) {
        if ((result as any).subtype.constructor?.name === 'PromiseJoint') {
          throw new Error('Returning joint promise is currently prohibited.');
        }

        printPromise(result);
        result.onReturn();
        // If the first action is a transfer, check if the balance is sufficient. If it is not,
        // we fail immediately in the synchronous part. As a result, any state changes won't be
        // committed. (this is how NEAR works today)
        const firstAction = methodContext.promises[0]?.actions[0];
        if (firstAction && firstAction.type === 'transfer') {
          this.checkBalance(methodContext.contractAccountId, firstAction.amount);
        }
      }

      if (options?.attachedDeposit && methodOptions?.payableFunction) {
        this.transfer(this.methodContext.predecessorAccountId, accountId, options.attachedDeposit);
      }

      this.serialize(contract);
    } finally {
      this.methodContext = {};
    }

    // run any asynchronous actions planned by the method
    return (async () => {
      try {
        for (const promise of methodContext.promises) {
          let results;
          try {
            results = await Promise.all(promise.actions.map(action => action.fn()));
            promise.result = _.last(results);
          } catch (err) {
            promise.result = err;
          }
        }

        let returnValue;
        if (result instanceof NearPromise) {
          returnValue = _.last(methodContext.promises)?.result;
        } else {
          returnValue = result;
        }

        if (returnValue instanceof Error) {
          throw returnValue;
        }

        return returnValue;
      } finally {
        for (const promise of methodContext.promises) {
          this.promises[methodContext.contractAccountId] = this.promises[
            methodContext.contractAccountId
          ].filter(p => p !== promise);
        }
      }
    })();
  }

  addAccount(accountId: string, balance = 0n) {
    this.accounts[accountId] = { id: accountId, balance };
  }

  private checkBalance(accountId: string, amount: NearAmount) {
    const amountBigint = typeof amount === 'bigint' ? amount : BigInt(amount);
    const availableBalance = this.accounts[accountId]?.balance ?? 0n;
    if (amountBigint > availableBalance) {
      throw new Error(
        `Not enough balance on account ${accountId}, asked for ${amountBigint}, available ${availableBalance}`,
      );
    }
  }

  transfer(srcAccountId: string, dstAccountId: string, amount: NearAmount = 0n) {
    const amountBigint = typeof amount === 'bigint' ? amount : BigInt(amount);
    this.checkBalance(srcAccountId, amount);

    // add amount to receiver
    this.accounts[dstAccountId] = {
      ...this.accounts[dstAccountId],
      balance: (this.accounts[dstAccountId]?.balance ?? 0n) + amountBigint,
    };

    // remove amount from current user
    this.accounts[srcAccountId] = {
      ...this.accounts[srcAccountId],
      balance: (this.accounts[srcAccountId]?.balance ?? 0n) - amountBigint,
    };
  }

  getBalance(accountId: string): bigint {
    return this.accounts[accountId]?.balance ?? 0n;
  }

  promiseDeploy(accountId: string, wasm: string) {
    this.promiseDeployCalls.push({ accountId, wasm });
  }

  async deploy(accountId: string, content: string): Promise<void> {
    const userspace = await JavaScriptUserspace.create({
      'contract.ts': {
        content,
      },
    });
    userspace.invalidateRequireCache();

    const account = this.accounts[accountId];
    if (!account) {
      this.addAccount(accountId, 0n);
    }

    const mock = createModuleMock({
      addContractCallback: (contractName, contractConstructor, options) => {
        const contract: Contract = {
          name: contractName,
          storage: new StorageMock(),
          instance: new contractConstructor(),
          constructor: contractConstructor,
          options,
        };

        // make sure the initial state is serialized in storage
        this.serialize(contract);

        this.contracts.set(accountId, contract);
      },
    });

    userspace.mockModule('near-sdk-js', mock);
    await userspace.import('contract.ts');
  }

  private isViewMethod(method: any) {
    return method[viewMetaKey] === true;
  }

  private isCallMethod(method: any) {
    return method[callMetaKey]?.isCallMethod === true;
  }

  private checkAccountExists(accountId: string) {
    if (!this.accounts[accountId]) {
      expect.fail(`Account ${accountId} does not exist`);
    }
  }

  /**
   * Returns a contract instance. Do not interact with the contract directly, it will not work.
   * Use the `view` and `call` methods instead.
   * @param {string} accountId
   */
  getContract(accountId: string): Contract {
    const contract = this.contracts.get(accountId);

    if (!contract) {
      expect.fail(
        `Contract class for account ${accountId} not found, is it marked with @NearBindgen?`,
      );
    }
    return contract;
  }

  moduleMock = createModuleMock({
    addContractCallback: (contractName, contractConstructor, options) => {},
  });

  private serialize(contract: Contract) {
    if (contract.options.serializer) {
      throw new Error('custom serializer support not implemented yet');
    }

    const state = _.pickBy(contract.instance, v => this.isAutoSerializable(v));
    contract.storage.set('STATE', serialize(state));
  }

  private deserialize(contract: Contract) {
    if (contract.options.deserializer) {
      throw new Error('custom deserializer support not implemented yet');
    }

    const stateBuffer = contract.storage.get('STATE');
    if (stateBuffer?.byteLength > 0) {
      const state = deserialize(contract.storage.get('STATE'));
      for (const key of Object.keys(contract.instance)) {
        // make sure we don't overwrite any property that's not being serialized automatically
        if (this.isAutoSerializable(contract.instance[key])) {
          contract.instance[key] = (state as any)[key];
        }
      }
    }
  }

  private isAutoSerializable(value: unknown) {
    // TODO: how does NEAR decide what properties to serialize?
    return (
      value === null ||
      value === undefined ||
      typeof value === 'number' ||
      typeof value === 'string' ||
      typeof value === 'bigint' ||
      Array.isArray(value) ||
      (typeof value === 'object' && value.constructor === Object)
    );
  }
}

function printPromise(promise: NearPromise) {
  // console.debug('subtype', (promise as any).subtype, 'promise', promise);
}
