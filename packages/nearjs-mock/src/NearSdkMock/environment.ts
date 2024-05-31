import { GasWeight, near, NearAmount, PromiseResult, Register } from 'near-sdk-js';
import { NearVmEnv } from 'near-sdk-js/lib/api';
import { NearSdkMock, PromiseMock } from '../NearSdkMock';

export class EnvironmentMock implements NearVmEnv {
  constructor(private nearMock: NearSdkMock) {}

  private registers = new Map<Register, Uint8Array>();

  reset() {
    this.registers.clear();
  }

  account_balance(): bigint {
    const accountId = this.nearMock.methodContext.contractAccountId;
    return this.nearMock.getBalance(accountId);
  }

  account_locked_balance(): bigint {
    throw new Error('Method not implemented.');
  }

  alt_bn128_g1_multiexp(value: Uint8Array, register: Register): void {
    throw new Error('Method not implemented.');
  }

  alt_bn128_g1_sum(value: Uint8Array, register: Register): void {
    throw new Error('Method not implemented.');
  }

  alt_bn128_pairing_check(value: Uint8Array): bigint {
    throw new Error('Method not implemented.');
  }

  attached_deposit(): bigint {
    return this.nearMock.methodContext.attachedDeposit;
  }

  block_index(): bigint {
    throw new Error('Method not implemented.');
  }

  block_timestamp(): bigint {
    throw new Error('Method not implemented.');
  }

  current_account_id(register: Register): void {
    this.registers.set(
      register,
      this.utf8_string_to_uint8array(this.nearMock.methodContext.contractAccountId),
    );
  }

  ecrecover(
    hash: Uint8Array,
    sig: Uint8Array,
    v: number,
    malleabilityFlag: number,
    register: Register,
  ): bigint {
    throw new Error('Method not implemented.');
  }

  epoch_height(): bigint {
    throw new Error('Method not implemented.');
  }

  input(register: Register): void {
    throw new Error('Method not implemented.');
  }

  keccak256(value: Uint8Array, register: Register): void {
    throw new Error('Method not implemented.');
  }

  keccak512(value: Uint8Array, register: Register): void {
    throw new Error('Method not implemented.');
  }

  latin1_string_to_uint8array(s: string): Uint8Array {
    throw new Error('Method not implemented.');
  }

  log(message: string): void {
    console.log(message);
  }

  log_utf16(message: Uint8Array): void {
    throw new Error('Method not implemented.');
  }

  log_utf8(message: Uint8Array): void {
    throw new Error('Method not implemented.');
  }

  panic_utf8(message: Uint8Array): never {
    throw new Error('Method not implemented.');
  }

  predecessor_account_id(register: Register): void {
    this.registers.set(
      register,
      this.utf8_string_to_uint8array(this.nearMock.methodContext.predecessorAccountId),
    );
  }

  prepaid_gas(): bigint {
    throw new Error('Method not implemented.');
  }

  promise_and(...promiseIndexes: bigint[]): bigint {
    if (promiseIndexes.length <= 0) {
      throw new Error('InvalidPromiseIndex');
    }
    const firstPromise = this.getPromise(promiseIndexes[0]);
    return this.createPromise(firstPromise.accountId);
  }

  promise_batch_action_add_key_with_full_access(
    promiseIndex: bigint,
    publicKey: Uint8Array,
    nonce: number | bigint,
  ): void {
    // do nothing
  }

  promise_batch_action_add_key_with_function_call(
    promiseIndex: bigint,
    publicKey: Uint8Array,
    nonce: number | bigint,
    allowance: NearAmount,
    receiverId: string,
    methodNames: string,
  ): void {
    throw new Error('Method not implemented.');
  }

  promise_batch_action_create_account(promiseIndex: bigint): void {
    const promise = this.getPromise(promiseIndex);
    this.nearMock.addAccount(promise.accountId, BigInt(0));
  }

  promise_batch_action_delete_account(promiseIndex: bigint, beneficiaryId: string): void {
    throw new Error('Method not implemented.');
  }

  promise_batch_action_delete_key(promiseIndex: bigint, publicKey: Uint8Array): void {
    throw new Error('Method not implemented.');
  }

  promise_batch_action_deploy_contract(promiseIndex: bigint, code: Uint8Array): void {
    const promise = this.getPromise(promiseIndex);
    const contract = this.uint8array_to_utf8_string(code);
    this.nearMock.promiseDeploy(promise.accountId, contract);
  }

  promise_batch_action_function_call(
    promiseIndex: bigint,
    methodName: string,
    args: Uint8Array,
    amount: NearAmount,
    gas: NearAmount,
  ): void {
    this.promise_batch_action_function_call_weight(
      promiseIndex,
      methodName,
      args,
      amount,
      gas,
      BigInt(0),
    );

    if (!gas) {
      throw new Error('FunctionCallZeroAttachedGas');
    }

    const signer = this.nearMock.methodContext.signerAccountId;
    const predecessor = this.nearMock.methodContext.contractAccountId;
    let attachedDeposit: bigint | undefined = undefined;
    if (amount) {
      attachedDeposit = typeof amount === 'bigint' ? amount : BigInt(amount);
    }

    const promise = this.getPromise(promiseIndex);
    promise.actions.push({
      type: 'functionCall',
      fn: async () => {
        return this.nearMock.call(
          promise.accountId,
          { signer, predecessor },
          methodName,
          args.length > 0 ? JSON.parse(this.uint8array_to_utf8_string(args)) : '',
          { attachedDeposit },
        );
      },
    });
  }

  promise_batch_action_function_call_weight(
    promiseIndex: bigint,
    methodName: string,
    args: Uint8Array,
    amount: NearAmount,
    gas: NearAmount,
    weight: GasWeight,
  ): void {}

  promise_batch_action_stake(
    promiseIndex: bigint,
    amount: NearAmount,
    publicKey: Uint8Array,
  ): void {
    throw new Error('Method not implemented.');
  }

  promise_batch_action_transfer(promiseIndex: bigint, amount: NearAmount): void {
    const promise = this.getPromise(promiseIndex);

    const { methodContext } = this.nearMock;

    promise.actions.push({
      type: 'transfer',
      amount,
      fn: async () => {
        this.nearMock.transfer(methodContext.contractAccountId, promise.accountId, amount);
        return '';
      },
    });
  }

  promise_batch_create(accountId: string): bigint {
    return this.createPromise(accountId);
  }

  promise_batch_then(promiseIndex: bigint, accountId: string): bigint {
    return this.createPromise(accountId);
  }

  promise_create(
    accountId: string,
    methodName: string,
    args: Uint8Array,
    amount: NearAmount,
    gas: NearAmount,
  ): bigint {
    throw new Error('Method not implemented.');
  }

  promise_result(promiseIndex: bigint, register: Register): PromiseResult {
    const promise = this.getPromise(promiseIndex);
    if (!Object.hasOwnProperty.call(promise, 'result')) {
      return PromiseResult.NotReady;
    }

    if (promise.result instanceof Error) {
      throw new Error('Cannot get result from a failed promise');
    }

    this.registers.set(register, this.utf8_string_to_uint8array(promise.result));

    return PromiseResult.Successful;
  }

  promise_results_count(): bigint {
    throw new Error('Method not implemented.');
  }

  promise_return(promiseIndex: bigint): void {
    // do nothing
  }

  promise_then(
    promiseIndex: bigint,
    accountId: string,
    methodName: string,
    args: Uint8Array,
    amount: NearAmount,
    gas: NearAmount,
  ): bigint {
    throw new Error('Method not implemented.');
  }

  random_seed(register: Register): void {
    const random = 'tourist use jump piece nut throw photo angle bag toast material crew';
    this.registers.set(register, this.utf8_string_to_uint8array(random));
  }

  read_register(register: Register): Uint8Array {
    return this.registers.get(register) ?? null;
  }

  ripemd160(value: Uint8Array, register: Register): void {
    throw new Error('Method not implemented.');
  }

  sha256(value: Uint8Array, register: Register): void {
    throw new Error('Method not implemented.');
  }

  signer_account_id(register: Register): void {
    this.registers.set(
      register,
      this.utf8_string_to_uint8array(this.nearMock.methodContext.signerAccountId),
    );
  }

  signer_account_pk(register: Register): void {
    this.registers.set(
      register,
      this.utf8_string_to_uint8array(this.nearMock.methodContext.signerAccountId),
    );
  }

  storage_has_key(key: Uint8Array): bigint {
    throw new Error('Method not implemented.');
  }

  storage_read(key: Uint8Array, register: Register): bigint {
    const keyStr = this.uint8array_to_utf8_string(key);
    const value = this.nearMock.methodContext.contract.storage.get(keyStr);
    this.registers.set(register, value);
    return 1n;
  }

  storage_remove(key: Uint8Array, register: Register): bigint {
    throw new Error('Method not implemented.');
  }

  storage_usage(): bigint {
    return BigInt(this.nearMock.methodContext.contract.storage.sizeInBytes());
  }

  storage_write(key: Uint8Array, value: Uint8Array, register: Register): bigint {
    const keyStr = this.uint8array_to_utf8_string(key);
    this.nearMock.methodContext.contract.storage.set(keyStr, value);
    return 1n;
  }

  uint8array_to_latin1_string(a: Uint8Array): string {
    return new TextDecoder('latin1').decode(a);
  }

  uint8array_to_utf8_string(a: Uint8Array): string {
    return new TextDecoder('utf8').decode(a);
  }

  used_gas(): bigint {
    throw new Error('Method not implemented.');
  }

  utf8_string_to_uint8array(s: string): Uint8Array {
    return new TextEncoder().encode(s);
  }

  validator_stake(accountId: string): bigint {
    throw new Error('Method not implemented.');
  }

  validator_total_stake(): bigint {
    throw new Error('Method not implemented.');
  }

  value_return(value: Uint8Array): void {
    throw new Error('Method not implemented.');
  }

  /* Promises helper functions  */

  private getPromise(promiseIndex: bigint): PromiseMock {
    const { contractAccountId } = this.nearMock.methodContext;
    return this.nearMock.promises[contractAccountId][Number(promiseIndex)];
  }

  private createPromise(accountId: string): bigint {
    // we need to store the promise in two places:
    // 1. On the method context, so we know which promises to execute
    // 2. On the contract that invoked the methods, so we can check the results (note that results
    //    are accessed from the callback method, which has different method context)
    const promise: PromiseMock = { accountId, actions: [] };

    const { contractAccountId } = this.nearMock.methodContext;
    this.nearMock.promises[contractAccountId] = this.nearMock.promises[contractAccountId] ?? [];
    const promiseIndex = BigInt(this.nearMock.promises[contractAccountId].length);

    this.nearMock.promises[contractAccountId].push(promise);
    this.nearMock.methodContext.promises.push(promise);

    return promiseIndex;
  }
}
