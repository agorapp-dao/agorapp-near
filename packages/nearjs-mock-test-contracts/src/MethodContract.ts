// Find all our documentation at https://docs.near.org
import { NearBindgen, near, call, view } from 'near-sdk-js';

@NearBindgen({})
class MethodContract {
  @view({})
  invoke_view({ test }: { test: string }): string {
    return 'Hello, world!';
  }

  @view({})
  invoke_view_with_args({ test }: { test: string }): string {
    return test;
  }

  @view({})
  invoke_call({ test }: { test: string }): string {
    return test;
  }
}
