import { NEAR, NearAccount, Worker } from 'near-workspaces';
import _ from 'lodash';
import { NearSdkMock } from './NearSdkMock';
import mockRequire from 'mock-require';

export type SignerAccountName = 'alice' | 'bob';

export interface IMockTester {
  isMock: boolean;
  beforeAll(): Promise<void>;
  afterAll(): Promise<void>;
  deploy(contractName: string): Promise<void>;
  view(contractName: string, methodName: string, args?: any): Promise<any>;
  call(
    signerName: SignerAccountName,
    contractName: string,
    methodName: string,
    args?: any,
  ): Promise<any>;
}

export function createTester(): IMockTester {
  if (process.env.TEST_INTEGRATION) {
    return new IntegrationTester();
  } else {
    return new MockTester();
  }
}

export class IntegrationTester implements IMockTester {
  isMock = false;
  worker: Worker;
  root: NearAccount;
  accounts = new Map<SignerAccountName, NearAccount>();
  contracts = new Map<string, NearAccount>();

  async beforeAll() {
    this.worker = await Worker.init();

    this.root = this.worker.rootAccount;
    const alice = await this.root.createSubAccount('alice', {
      initialBalance: NEAR.parse('30 N').toJSON(),
    });
    this.accounts.set('alice', alice);
    const bob = await this.root.createSubAccount('bob', {
      initialBalance: NEAR.parse('20 N').toJSON(),
    });
    this.accounts.set('bob', alice);
  }

  async afterAll() {
    // Stop Sandbox server
    await this.worker.tearDown().catch(error => {
      console.log('Failed to stop the Sandbox:', error);
    });
  }

  async deploy(contractName: string) {
    const contract = await this.root.createSubAccount(_.kebabCase(contractName));
    await contract.deploy(`../nearjs-mock-test-contracts/build/${contractName}.wasm`);
    this.contracts.set(contractName, contract);
  }

  async view(contractName: string, methodName: string, args?: any) {
    const contract = this.contracts.get(contractName);
    if (!contract) {
      throw new Error(`Contract ${contractName} not found`);
    }
    return await contract.view(methodName, args || {});
  }

  async call(signerName: SignerAccountName, contractName: string, methodName: string, args?: any) {
    const contract = this.contracts.get(contractName);
    if (!contract) {
      throw new Error(`Contract ${contractName} not found`);
    }

    const account = this.accounts.get(signerName);
    if (!account) {
      throw new Error(`Signer account ${signerName} not found`);
    }

    return await account.call(contract, methodName, args || {});
  }
}

export class MockTester implements IMockTester {
  isMock = true;

  mock: NearSdkMock;

  async beforeAll() {
    this.mock = new NearSdkMock();
    mockRequire('near-sdk-js', this.mock.moduleMock);
  }

  async afterAll() {}

  async deploy(contractName: string) {
    await import(`../tmp/${contractName}.ts`);
  }

  async view(contractName: string, methodName: string, args?: any) {
    return this.mock.view(contractName, methodName, args);
  }

  async call(signerName: SignerAccountName, contractName: string, methodName: string, args?: any) {
    return this.mock.call(signerName, contractName, methodName, args);
  }
}
