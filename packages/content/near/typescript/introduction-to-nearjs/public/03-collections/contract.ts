import { NearBindgen, view, call } from 'near-sdk-js';

@NearBindgen({})
class Counter {
  count = 0;

  @view({})
  get_count(): number {
    return this.count;
  }

  @call({})
  increment() {
    this.count++;
  }
}
