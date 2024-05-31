import type { Config, JsonRpcProvider, NearAccount, Worker } from 'near-workspaces';
import { NearAccountMock } from './account';
import { NearWorkspacesMock } from '../NearWorkspacesMock';

export function createWorkerMock(workspacesMock: NearWorkspacesMock) {
  return class WorkerMock implements Partial<Worker> {
    static async init(config?: Partial<Config>): Promise<Worker> {
      const worker = new WorkerMock();
      workspacesMock.nearMock.addAccount('test.near', 10n ** 9n * 10n ** 24n);
      return worker as unknown as Worker;
    }

    get provider(): JsonRpcProvider {
      return undefined;
    }

    get rootAccount(): NearAccount {
      return new NearAccountMock(workspacesMock, 'test.near') as unknown as NearAccount;
    }

    tearDown(): Promise<void> {
      return Promise.resolve(undefined);
    }
  };
}
