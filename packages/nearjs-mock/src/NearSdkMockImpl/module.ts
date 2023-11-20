import { NearSdkMock } from '../NearSdkMock';
import { decoratorsMock } from './decorators';
import { lookupMapMock } from './LookupMap';
import { environmentMock } from './environment';

export function createModuleMock(nearMock: NearSdkMock) {
  return {
    ...decoratorsMock(nearMock),
    ...lookupMapMock(nearMock),
    ...environmentMock(nearMock),
  };
}
