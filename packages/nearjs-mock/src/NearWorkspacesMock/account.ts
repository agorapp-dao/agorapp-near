import {
  AccessKeyList,
  AccessKeyView,
  AccountBalance,
  AccountView,
  BN,
  CodeResult,
  Empty,
  KeyPair,
  NEAR,
  NearAccount,
  PublicKey,
  StateItem,
  Transaction,
  TransactionResult,
} from 'near-workspaces';
import type { AccessKeyData, AccountData, Records } from 'near-workspaces/dist/record';
import type { ContractState } from 'near-workspaces/dist/contract-state';
import { NearWorkspacesMock } from '../NearWorkspacesMock';

export class NearAccountMock implements NearAccount {
  constructor(private workspacesMock: NearWorkspacesMock, public readonly accountId: string) {}

  accountView(): Promise<AccountView> {
    return Promise.resolve(undefined);
  }

  async availableBalance(): Promise<NEAR> {
    const balance = this.workspacesMock.nearMock.getBalance(this.accountId);
    return NEAR.from(balance.toString());
  }

  balance(): Promise<AccountBalance> {
    return Promise.resolve(undefined);
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  batch(receiver: NearAccount | string): Transaction {
    return undefined;
  }

  async call<T>(
    contractId: NearAccount | string,
    methodName: string,
    args: Record<string, unknown> | Uint8Array,
    options?: {
      gas?: string | BN;
      attachedDeposit?: string | BN;
      signWithKey?: KeyPair;
    },
  ): Promise<T> {
    const { nearMock } = this.workspacesMock;

    const targetId = typeof contractId === 'string' ? contractId : contractId.accountId;
    const opts = options?.attachedDeposit
      ? { attachedDeposit: BigInt(options.attachedDeposit.toString()) }
      : undefined;
    const res = await nearMock.call(targetId, this.accountId, methodName, args, opts);
    return res;
  }

  callRaw(
    contractId: NearAccount | string,
    methodName: string,
    args: Record<string, unknown> | Uint8Array,
    options?: {
      gas?: string | BN;
      attachedDeposit?: string | BN;
      signWithKey?: KeyPair;
    },
  ): Promise<TransactionResult> {
    return Promise.resolve(undefined);
  }

  createAccount(
    accountId: string,
    options?: { keyPair?: KeyPair; initialBalance?: string },
  ): Promise<NearAccount> {
    return Promise.resolve(undefined);
  }

  async createSubAccount(
    accountId: string,
    options?: { keyPair?: KeyPair; initialBalance?: string },
  ): Promise<NearAccount> {
    const subaccountId = `${accountId}.${this.accountId}`;
    this.workspacesMock.nearMock.addAccount(subaccountId, 100n * 10n ** 24n);
    return new NearAccountMock(this.workspacesMock, subaccountId) as unknown as NearAccount;
  }

  delete(beneficiaryId: string, keyPair?: KeyPair): Promise<TransactionResult> {
    return Promise.resolve(undefined);
  }

  async deploy(code: string | URL | Uint8Array): Promise<TransactionResult> {
    const deployable = this.workspacesMock.deployables.find(d => d.wasm === code);
    if (!deployable) {
      throw new Error(`Cannot deploy ${code}, not found.`);
    }

    await this.workspacesMock.nearMock.deploy(this.accountId, deployable.source);

    return {} as any;
  }

  devCreateAccount(): Promise<NearAccount> {
    return Promise.resolve(undefined);
  }

  devDeploy(
    wasm: string | URL | Uint8Array,
    options?: {
      args?: Record<string, unknown> | Uint8Array;
      attachedDeposit?: string | BN;
      gas?: string | BN;
      initialBalance?: BN | string;
      keyPair?: KeyPair;
      method?: string;
      isSubAccount?: boolean;
    },
  ): Promise<NearAccount> {
    return Promise.resolve(undefined);
  }

  exists(): Promise<boolean> {
    return Promise.resolve(false);
  }

  getAccount(accountId: string): NearAccount {
    return undefined;
  }

  getKey(): Promise<KeyPair | null> {
    return Promise.resolve(undefined);
  }

  getSubAccount(accountIdPrefix: string): NearAccount {
    return undefined;
  }

  importContract(options: {
    testnetContract?: string;
    mainnetContract?: string;
    withData?: boolean;
    keyPair?: KeyPair;
    initialBalance?: string;
    blockId?: number | string;
    isSubAccount?: boolean;
  }): Promise<NearAccount> {
    return Promise.resolve(undefined);
  }

  makeSubAccount(accountId: string): string {
    return '';
  }

  patchState(key: string, value_: any, borshSchema?: any): Promise<any> {
    return Promise.resolve(undefined);
  }

  patchStateRecords(records: Records): Promise<Empty> {
    return Promise.resolve(undefined);
  }

  setKey(keyPair?: KeyPair): Promise<PublicKey> {
    return Promise.resolve(undefined);
  }

  subAccountOf(accountId: string): boolean {
    return false;
  }

  toJSON(): string {
    return '';
  }

  transfer(accountId: string | NearAccount, amount: string | BN): Promise<TransactionResult> {
    return Promise.resolve(undefined);
  }

  updateAccessKey(
    key: string | PublicKey | KeyPair,
    access_key_data?: AccessKeyData,
  ): Promise<Empty> {
    return Promise.resolve(undefined);
  }

  updateAccount(accountData?: Partial<AccountData>): Promise<Empty> {
    return Promise.resolve(undefined);
  }

  updateContract(binary: string): Promise<Empty> {
    return Promise.resolve(undefined);
  }

  updateData(data: string, value: string): Promise<Empty> {
    return Promise.resolve(undefined);
  }

  view<T>(method: string, args?: Record<string, unknown> | Uint8Array): Promise<T> {
    const { nearMock } = this.workspacesMock;

    const res = nearMock.view(this.accountId, method, args);
    return res;
  }

  viewAccessKey(accountId: string, publicKey: PublicKey | string): Promise<AccessKeyView> {
    return Promise.resolve(undefined);
  }

  viewAccessKeys(accountId: string): Promise<AccessKeyList> {
    return Promise.resolve(undefined);
  }

  viewCode(): Promise<any> {
    return Promise.resolve(undefined);
  }

  viewCodeRaw(): Promise<string> {
    return Promise.resolve('');
  }

  viewRaw(method: string, args?: Record<string, unknown> | Uint8Array): Promise<CodeResult> {
    return Promise.resolve(undefined);
  }

  viewState(prefix?: string | Uint8Array): Promise<ContractState> {
    return Promise.resolve(undefined);
  }

  viewStateRaw(prefix?: string | Uint8Array): Promise<StateItem[]> {
    return Promise.resolve([]);
  }
}
