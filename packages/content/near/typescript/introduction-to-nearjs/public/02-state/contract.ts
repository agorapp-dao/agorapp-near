import { NearBindgen, view, call } from 'near-sdk-js';

@NearBindgen({})
class Counter {
  @view({})
  get_count(): number {
    return 0;
  }
}
