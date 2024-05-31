import { createModuleMock } from './NearWorkspacesMock/module';
import { NearSdkMock } from './NearSdkMock';

interface Deployable {
  wasm: string;
  source: string;
}

export class NearWorkspacesMock {
  deployables: Deployable[] = [];
  nearMock = new NearSdkMock();

  moduleMock = createModuleMock(this);
}
