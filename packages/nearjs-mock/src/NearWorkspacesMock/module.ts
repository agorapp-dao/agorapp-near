import { createWorkerMock } from './worker';
import { NearWorkspacesMock } from '../NearWorkspacesMock';
import { NEAR } from 'near-workspaces';

export function createModuleMock(workspacesMock: NearWorkspacesMock) {
  return {
    Worker: createWorkerMock(workspacesMock),
    NEAR,
  };
}
