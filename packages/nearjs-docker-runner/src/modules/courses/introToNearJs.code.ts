import { TEditorFileMap } from '@agorapp-dao/runner-common/src/types';
import dedent from 'ts-dedent';

export const CODE_01_VALID: TEditorFileMap = {
  'contract.ts': {
    content: dedent`
      import { NearBindgen, view } from 'near-sdk-js';
    
      @NearBindgen({})
      class Counter {
      
        @view({})
        get_count(): number {
          return 0;
        }
      }     
    `,
  },
};

export const CODE_01_MISSING_NEARBINDGEN: TEditorFileMap = {
  'contract.ts': {
    content: dedent`
      import { NearBindgen, view } from 'near-sdk-js';
    
      class Counter {
      
        @view({})
        get_count(): number {
          return 0;
        }
      }     
    `,
  },
};

export const CODE_01_MISSING_VIEW: TEditorFileMap = {
  'contract.ts': {
    content: dedent`
      import { NearBindgen, view } from 'near-sdk-js';
    
      @NearBindgen({})
      class Counter {
      
        get_count(): number {
          return 0;
        }
      }     
    `,
  },
};

export const CODE_02_VALID: TEditorFileMap = {
  'contract.ts': {
    content: dedent`
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
    `,
  },
};

export const CODE_03_VALID: TEditorFileMap = {
  'contract.ts': {
    content: dedent`
      import { NearBindgen, view, call, LookupMap } from 'near-sdk-js';
      
      @NearBindgen({})
      class Counter {
        counters = new LookupMap<number>('counters');
      
        @view({})
        get_count({ key }: { key: string }): number {
          return this.counters.get(key) || 0;
        }
      
        @call({})
        increment({ key }: { key: string }) {
          let count = this.get_count({ key });
          count++;
          this.counters.set(key, count);
        }
      }
    `,
  },
};

export const CODE_03_BAD_MAP: TEditorFileMap = {
  'contract.ts': {
    content: dedent`
      import { NearBindgen, view, call, LookupMap } from 'near-sdk-js';
      
      @NearBindgen({})
      class Counter {
        counters = new Map<string, number>();
      
        @view({})
        get_count({ key }: { key: string }): number {
          return this.counters.get(key) || 0;
        }
      
        @call({})
        increment({ key }: { key: string }) {
          let count = this.get_count({ key });
          count++;
          this.counters.set(key, count);
        }
      }
    `,
  },
};

export const CODE_04_VALID: TEditorFileMap = {
  'contract.ts': {
    content: dedent`
      import { NearBindgen, view, call, LookupMap, near } from 'near-sdk-js';
      
      @NearBindgen({})
      class Counter {
        counters = new LookupMap<number>('counters');
      
        @view({})
        get_count({ accountId }: { accountId: string }): number {
          return this.counters.get(accountId) || 0;
        }
      
        @call({})
        increment() {
          const accountId = near.signerAccountId();
          let count = this.get_count({ accountId });
          count++;
          this.counters.set(accountId, count);
        }
      }
    `,
  },
};

export const CODE_04_PREDECESSOR: TEditorFileMap = {
  'contract.ts': {
    content: dedent`
      import { NearBindgen, view, call, LookupMap, near } from 'near-sdk-js';
      
      @NearBindgen({})
      class Counter {
        counters = new LookupMap<number>('counters');
      
        @view({})
        get_count({ accountId }: { accountId: string }): number {
          return this.counters.get(accountId) || 0;
        }
      
        @call({})
        increment() {
          const accountId = near.predecessorAccountId();
          let count = this.get_count({ accountId });
          count++;
          this.counters.set(accountId, count);
        }
      }
    `,
  },
};
