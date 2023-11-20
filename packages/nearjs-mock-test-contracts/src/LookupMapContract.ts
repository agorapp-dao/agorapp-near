// Find all our documentation at https://docs.near.org
import { NearBindgen, near, call, view, LookupMap } from 'near-sdk-js';

@NearBindgen({})
class LookupMapContract {
  map: LookupMap<number> = new LookupMap<number>('map');

  @view({})
  get_entry({ key }: { key: string }): number {
    return this.map.get(key);
  }

  @call({})
  set_entry({ key, value }: { key: string; value: number }): void {
    this.map.set(key, value);
  }
}
