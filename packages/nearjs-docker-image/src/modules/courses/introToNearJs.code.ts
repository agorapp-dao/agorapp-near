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

export const CODE_05_VALID: TEditorFileMap = {
  'game.ts': {
    content: dedent`
      import { NearBindgen, call, near } from 'near-sdk-js';
      
      @NearBindgen({})
      class Game {
      
        @call({ payableFunction: true })
        join() {
          if (near.attachedDeposit() !== 1_000_000n) {
            throw new Error('Join fee is 1,000,000 yoctoNEAR');
          }
        }
      }
    `,
  },
};

export const CODE_06_VALID: TEditorFileMap = {
  'game.ts': {
    content: dedent`
      import { NearBindgen, call, near, NearPromise } from 'near-sdk-js';
      
      @NearBindgen({})
      class BeekeepersGame {
      
        players: string[] = [];
      
        @call({ payableFunction: true })
        join() {
          const deposit = near.attachedDeposit();
          if (!deposit || deposit !== 1_000_000n) {
            throw new Error('Join fee is 1,000,000 yoctoNEAR');
          }

          this.players.push(near.signerAccountId())
        }

        pick_winner(): string {
          const randomSeed = new TextDecoder('utf8').decode(near.randomSeed());
          const randomNumber = randomSeed.charCodeAt(0) % this.players.length;

          return this.players[randomNumber];
        }

        @call({})
        play() {
          return NearPromise.new(this.pick_winner()).transfer(near.accountBalance());
        }
      }
    `,
  },
};

export const CODE_07_VALID: TEditorFileMap = {
  'game.ts': {
    content: dedent`
        import { NearBindgen, call, near, NearPromise } from 'near-sdk-js';
        
        @NearBindgen({})
        class Game {
          players: string[] = [];
          joinFee = 1_000_000n;
        
          @call({ payableFunction: true })
          join() {
            if (near.attachedDeposit() !== this.joinFee) {
              throw new Error(\`Join fee is \${this.joinFee} yoctoNEAR\`);
            }
        
            this.players.push(near.signerAccountId());
          }
        
          pick_winner(): string {
            const randomSeed = new TextDecoder('utf8').decode(near.randomSeed());
            const randomNumber = randomSeed.charCodeAt(0) % this.players.length;
        
            return this.players[randomNumber];
          }
        
          @call({})
          play() {
            const winner = this.pick_winner();
            return NearPromise.new(winner).transfer(near.accountBalance());
          }
        
          @call({})
          abort() {
            let res;
            for (const player of this.players) {
              const promise = NearPromise.new(player).transfer(this.joinFee);
              if (!res) {
                res = promise;
              } else {
                res = res.then(promise);
              }
            }
            return res;
          }
        }
     `,
  },
};

export const CODE_08_VALID: TEditorFileMap = {
  'game.ts': {
    content: dedent`
      import { NearBindgen, call, near, NearPromise } from 'near-sdk-js';
      
      @NearBindgen({})
      class Game {
        players: string[] = [];
        joinFee = 1_000_000n;
      
        @call({ payableFunction: true })
        join() {
          if (near.attachedDeposit() !== this.joinFee) {
            throw new Error(\`Join fee is \${this.joinFee} yoctoNEAR\`);
          }
      
          this.players.push(near.signerAccountId());
        }
      
        pick_winner(): string {
          const randomSeed = new TextDecoder('utf8').decode(near.randomSeed());
          const randomNumber = randomSeed.charCodeAt(0) % this.players.length;
      
          return this.players[randomNumber];
        }
      
        @call({})
        play() {
          if (near.predecessorAccountId() !== 'game-manager.near') {
            throw new Error('Unauthorized')
          }
      
          const winner = this.pick_winner();
          return NearPromise.new(winner).transfer(near.accountBalance());
        }
      
        @call({})
        abort() {
          let res;
          for (const player of this.players) {
            const promise = NearPromise.new(player).transfer(this.joinFee);
            if (!res) {
              res = promise;
            } else {
              res = res.then(promise);
            }
          }
          return res;
        }
      }
      `,
  },
  'game-manager.ts': {
    content: dedent`
      import { NearBindgen, call, near, NearPromise } from 'near-sdk-js';
      
      const GAS = 50_000_000_000_000n;
      
      @NearBindgen({})
      class GameManager {
        @call({})
        execute({ gameAccountId }: { gameAccountId: string }) {
          return NearPromise.new(gameAccountId).functionCall(
            'play',
            '',
            0n,
            GAS,
          );
        }
      }
     `,
  },
};

export const CODE_09_VALID: TEditorFileMap = {
  'game.ts': CODE_08_VALID['game.ts'],
  'game-manager.ts': {
    content: dedent`
      import { NearBindgen, call, near, NearPromise } from 'near-sdk-js';
      
      const GAS = 50_000_000_000_000n;
      
      @NearBindgen({})
      class GameManager {
        gamesPlayed = 0;
      
        @call({})
        execute({ gameAccountId }: { gameAccountId: string }) {
          return NearPromise.new(gameAccountId)
            .functionCall('play', '', 0n, GAS)
            .then(
              NearPromise.new(near.currentAccountId()).functionCall('play_callback', '', 0n, GAS)
            );
        }
      
        @call({ privateFunction: true })
        play_callback() {
          this.gamesPlayed++;
        }
      }
     `,
  },
};

export const CODE_10_VALID: TEditorFileMap = {
  'game.ts': CODE_08_VALID['game.ts'],
  'game-manager.ts': {
    content: dedent`
      import * as crypto from 'crypto';
      import { NearBindgen, call, near, NearPromise, includeBytes  } from 'near-sdk-js';
      
      const GAS = 50_000_000_000_000n;
      const GAME_CODE = includeBytes('./game.wasm');
      
      @NearBindgen({})
      class GameManager {
        gamesPlayed = 0;
      
        @call({})
        start() {
          const gameAccountId = crypto.randomUUID();
      
          return NearPromise.new(\`\${gameAccountId}.game.near\`)
            .createAccount()
            .transfer(5n * BigInt(Math.pow(10, 24)))
            .deployContract(GAME_CODE)
        }
      
        @call({})
        execute({ gameAccountId }: { gameAccountId: string }) {
          return NearPromise.new(gameAccountId)
            .functionCall('play', '', 0n, GAS)
            .then(NearPromise.new(near.currentAccountId()).functionCall('play_callback', '', 0n, GAS));
        }
      
        @call({ privateFunction: true })
        play_callback() {
          this.gamesPlayed++;
        }
      }
     `,
  },
};

export const CODE_11_VALID: TEditorFileMap = {
  'secret.ts': {
    content: dedent`
      export const secret = 'NEAR is awesome!';
    `,
  },
};
