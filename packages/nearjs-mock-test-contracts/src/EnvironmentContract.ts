// Find all our documentation at https://docs.near.org
import { NearBindgen, near, call, view } from 'near-sdk-js';

@NearBindgen({})
class EnvironmentContract {
  @view({})
  get_currentAccountId(): string {
    return near.currentAccountId();
  }

  @view({})
  get_signerAccountId(): string {
    return near.signerAccountId();
  }

  // I can't return signerAccountId directly from view method. I can't return it from call method either.
  // I have to store it to state first and then return it from another view method.
  signerAccountIdState = '';

  @call({})
  call_setSignerAccountIdState() {
    this.signerAccountIdState = near.signerAccountId();
  }

  @view({})
  get_signerAccountIdState(): string {
    return this.signerAccountIdState;
  }

  @view({})
  get_predecessorAccountId(): string {
    return near.predecessorAccountId();
  }

  // I can't return predecessorAccountId directly from view method. I can't return it from call method either.
  // I have to store it to state first and then return it from another view method.
  predecessorAccountIdState = '';

  @call({})
  call_setPredecessorAccountIdState() {
    this.predecessorAccountIdState = near.predecessorAccountId();
  }

  @view({})
  get_predecessorAccountIdState(): string {
    return this.predecessorAccountIdState;
  }
}
