import { NearSdkMock } from './NearSdkMock';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
chai.config.truncateThreshold = 0;

describe('NearSdkMock', () => {
  describe('storage', () => {
    it('contract properties are stored automatically', async () => {
      const contract = `
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
      `;
      const nearMock = new NearSdkMock();
      const { near } = nearMock.moduleMock;
      nearMock.addAccount('alice.near', 1_000_000_000n);
      await nearMock.deploy('bob.near', contract);

      const count = nearMock.view('bob.near', 'get_count');
      expect(count).to.equal(0);
      expect(near.storageUsage()).to.equal(16n);
    });

    it('LookupMap', async () => {
      const nearMock = new NearSdkMock();
      const { near } = nearMock.moduleMock;
      nearMock.addAccount('alice.near', 1_000_000_000n);
      nearMock.addAccount('bob.near', 1_000_000_000n);
      await nearMock.deploy(
        'alice.near',
        `
        import { NearBindgen, view, call, LookupMap } from 'near-sdk-js';
  
        @NearBindgen({})
        class TestCoin {
        
          balances = new LookupMap<number>('balances');
        
          @view({})
          get_balance({ key }: { key: string }): number {
            return this.balances.get(key);
          }
        
          @call({})
          set_balance({ key, balance }: { key: string, balance: number }) {
            this.balances.set(key, balance);
          }
        }
      `,
      );

      let balance = nearMock.view('alice.near', 'get_balance');
      expect(balance).to.equal(null);
      expect(near.storageUsage()).to.equal(7n);

      await nearMock.call('alice.near', 'bob.near', 'set_balance', { key: 'bob', balance: 100 });
      balance = nearMock.view('alice.near', 'get_balance', { key: 'bob' });
      expect(balance).to.equal(100);
      expect(near.storageUsage()).to.equal(21n);
    });
  });

  describe('accounts', () => {
    let nearMock: NearSdkMock;
    const contract = `
        import { NearBindgen, view, call } from 'near-sdk-js';
  
        @NearBindgen({})
        class Counter {
          @call({})
          increment() {
            this.count++;
          }
        }
      `;

    beforeEach(async () => {
      nearMock = new NearSdkMock();
    });

    it('unknown caller', async () => {
      await nearMock.deploy('alice.near', contract);

      expect(() => nearMock.call('alice.near', 'xxx', 'increment')).to.throw(
        'Account xxx does not exist',
      );
    });

    it('unknown caller - signer', async () => {
      await nearMock.deploy('alice.near', contract);

      expect(() =>
        nearMock.call('alice.near', { signer: 'xxx', predecessor: 'alice.near' }, 'increment'),
      ).to.throw('Account xxx does not exist');
    });

    it('unknown caller - predecessor', async () => {
      nearMock.addAccount('alice.near', 1_000_000_000n);
      await nearMock.deploy('alice.near', contract);

      expect(() =>
        nearMock.call('alice.near', { signer: 'alice.near', predecessor: 'xxx' }, 'increment'),
      ).to.throw('Account xxx does not exist');
    });

    it('caller specifies both signer and predecessor', async () => {
      nearMock.addAccount('alice.near', 1_000_000_000n);
      await nearMock.deploy('bob.near', contract);
      await nearMock.call('bob.near', 'alice.near', 'increment');
      expect(nearMock.__lastMethodContext.signerAccountId).to.equal('alice.near');
      expect(nearMock.__lastMethodContext.predecessorAccountId).to.equal('alice.near');
    });

    it('specify different signer and predecessor', async () => {
      nearMock.addAccount('alice.near', 1_000_000_000n);
      nearMock.addAccount('bob.near', 1_000_000_000n);
      await nearMock.deploy('bob.near', contract);
      await nearMock.call(
        'bob.near',
        { signer: 'alice.near', predecessor: 'bob.near' },
        'increment',
      );
      expect(nearMock.__lastMethodContext.signerAccountId).to.equal('alice.near');
      expect(nearMock.__lastMethodContext.predecessorAccountId).to.equal('bob.near');
    });
  });

  describe('Decorators', () => {
    describe('privateFunction', () => {
      it('fails when other account wants to call private function', async () => {
        const nearMock = new NearSdkMock();

        nearMock.addAccount('bob.near');
        await nearMock.deploy(
          'bob.near',
          `
         import { NearPromise, NearBindgen, call, near } from "near-sdk-js";

          @NearBindgen({})
          export class Contract {
            @call({ privateFunction: true })
            say_hi() {
              return "Hi";
            }
          }
       `,
        );

        nearMock.addAccount('alice.near');

        expect(() => nearMock.call('bob.near', 'alice.near', 'say_hi')).to.throw(
          'Method say_hi is private and can only be called by the contract itself',
        );
      });
      it('calls private function when same account calls it', async () => {
        const nearMock = new NearSdkMock();

        nearMock.addAccount('bob.near');
        await nearMock.deploy(
          'bob.near',
          `
         import { NearPromise, NearBindgen, call, near } from "near-sdk-js";

          @NearBindgen({})
          export class Contract {
            @call({ privateFunction: true })
            say_hi() {
              return "Hi";
            }
          }
       `,
        );

        await nearMock.call('bob.near', 'bob.near', 'say_hi');
      });
    });

    describe('payableFunction', () => {
      it('fails calling function missing payableFunction decorator with attached deposit', async () => {
        const nearMock = new NearSdkMock();

        nearMock.addAccount('bob.near');
        await nearMock.deploy(
          'bob.near',
          `
         import { NearBindgen, call } from "near-sdk-js";

          @NearBindgen({})
          export class Contract {
            @call({})
            say_hi() {
              return "Hi";
            }
          }
       `,
        );

        nearMock.addAccount('alice.near', 5_000_000_000n);

        expect(() =>
          nearMock.call(
            'bob.near',
            'alice.near',
            'say_hi',
            {},
            { attachedDeposit: 5_000_000_000n },
          ),
        ).to.throw(
          'Method say_hi is not payable. Did you decorate it with @call({ payableFunction: true })?',
        );
      });

      it('calls a function decorated with payableFunction', async () => {
        const nearMock = new NearSdkMock();

        nearMock.addAccount('bob.near');
        await nearMock.deploy(
          'bob.near',
          `
         import { NearBindgen, call, near } from "near-sdk-js";

          @NearBindgen({})
          export class Contract {
            @call({ payableFunction: true })
            say_hi() {
              return \`Hi \${near.attachedDeposit() ?? 'without deposit'}\`;
            }
          }
       `,
        );

        nearMock.addAccount('alice.near', 5_000_000_000n);

        expect(
          await nearMock.call(
            'bob.near',
            'alice.near',
            'say_hi',
            {},
            { attachedDeposit: 5_000_000_000n },
          ),
        ).to.equal('Hi 5000000000');

        expect(await nearMock.call('bob.near', 'alice.near', 'say_hi')).to.equal(
          'Hi without deposit',
        );
      });
    });
  });

  describe('Promises', () => {
    describe('Sending $NEAR', () => {
      let nearMock: NearSdkMock;

      beforeEach(async () => {
        nearMock = new NearSdkMock();
      });

      it('transfers money', async () => {
        nearMock.addAccount('contract.near', 6_000_000_000n);
        await nearMock.deploy(
          'contract.near',
          `
         import { NearPromise, NearBindgen, call } from "near-sdk-js";

          @NearBindgen({})
          export class Contract {
            @call({ payableFunction: true })
            pay({ amount, to }) {
              return NearPromise.new(to).transfer(amount);
            }
          }
       `,
        );

        nearMock.addAccount('alice.near', 0n);

        await nearMock.call('contract.near', 'alice.near', 'pay', {
          amount: 4_000_000_000n,
          to: 'alice.near',
        });
        expect(nearMock.getBalance('contract.near')).to.equal(2_000_000_000n);
        expect(nearMock.getBalance('alice.near')).to.equal(4_000_000_000n);
      });

      it('transfer fails', async () => {
        nearMock.addAccount('contract.near', 6_000_000_000n);
        await nearMock.deploy(
          'contract.near',
          `
         import { NearPromise, NearBindgen, call, view } from "near-sdk-js";

          @NearBindgen({})
          export class Contract {
            payments = 0;
          
            @call({ payableFunction: true })
            pay({ amount, to }) {
              this.payments++;
              return NearPromise.new(to).transfer(amount);
            }
            
            @view({})
            get_payments() {
              return this.payments;
            }
          }
       `,
        );

        nearMock.addAccount('alice.near', 0n);

        expect(() =>
          nearMock.call('contract.near', 'alice.near', 'pay', {
            amount: 8_000_000_000n,
            to: 'alice.near',
          }),
        ).to.throw(/Not enough balance/);

        const payments = nearMock.view('contract.near', 'get_payments');
        expect(payments).to.equal(0);

        expect(nearMock.getBalance('alice.near')).to.equal(0n);
        expect(nearMock.getBalance('contract.near')).to.equal(6_000_000_000n);
      });
    });

    describe('Creating Accounts', () => {
      let nearMock: NearSdkMock;

      beforeEach(async () => {
        nearMock = new NearSdkMock();
      });

      it('creates an account', async () => {
        const { near } = nearMock.moduleMock;

        nearMock.addAccount('my-game.near', 8_000_000_000n);
        await nearMock.deploy(
          'my-game.near',
          `
         import { NearPromise, near, call, NearBindgen } from "near-sdk-js";

          @NearBindgen({})
          export class Contract {
            @call({ privateFunction: true })
            create_subaccount({ username }: { username: string }) {
              const subaccountId = \`\${username}.\${near.currentAccountId()}\`;
              return NearPromise.new(subaccountId).createAccount().addFullAccessKey(near.signerAccountPk()).transfer(${8_000_000_000n});
            }
            
            @call({})
            get_signer_account(): string {
              return near.signerAccountId();
            }
          }
       `,
        );

        await nearMock.call('my-game.near', 'my-game.near', 'create_subaccount', {
          username: 'bob',
        });

        // It does not fail on non existing account error
        expect(
          await nearMock.call('my-game.near', 'bob.my-game.near', 'get_signer_account'),
        ).to.equal('bob.my-game.near');

        expect(nearMock.__lastMethodContext.signerAccountId).to.equal('bob.my-game.near');
        expect(nearMock.getBalance('bob.my-game.near')).to.equal(8_000_000_000n);
      });
    });

    describe('Deploy code', () => {
      it('deploys sample code and calls it', async () => {
        const nearMock = new NearSdkMock();
        nearMock.addAccount('account.near');
        nearMock.addAccount('bob.near');

        await nearMock.deploy(
          'account.near',
          `
              import { NearPromise, NearBindgen, near, call, includeBytes } from 'near-sdk-js';
      
              const CODE = includeBytes("./hello_near.wasm");
      
              @NearBindgen({})
              export class Contract {
                @call({ privateFunction: true })
                deploy_code() {
                  return NearPromise.new(near.currentAccountId()).deployContract(CODE);
                }
              }
       `,
        );

        await nearMock.call('account.near', 'account.near', 'deploy_code');

        expect(nearMock.promiseDeployCalls.length).to.equal(1);
        expect(nearMock.promiseDeployCalls[0].wasm.toString()).to.equal('test wasm');
        expect(nearMock.promiseDeployCalls[0].accountId).to.equal('account.near');
      });
    });

    describe('Cross-Contract Calls', () => {
      let nearMock: NearSdkMock;
      const guestBookAccount = 'guestbook.near';
      const greetAccount = 'greet.near';

      const guestBookContract = `
        import { NearBindgen, NearPromise, call, view, near } from 'near-sdk-js';
        
        interface IMessage {
          from: string;
          message: string;
        }
        
        @NearBindgen({})
        export class GuestBookContract {
          messages: IMessage[] = [];
        
          @view({})
          get_messages(): IMessage[] {
            return this.messages;
          }
        
          @call({})
          leave_message({ message }: { message: string }) {
            this.messages.push({ from: near.signerAccountId(), message });
            return this.messages;
          }
        }
       `;

      const greetContract = `
         import { NearBindgen, NearPromise, call, view, near } from 'near-sdk-js';
        
         const FIVE_TGAS = BigInt(50000000000000);
         const NO_DEPOSIT = BigInt(0);
         const NO_ARGS = JSON.stringify({});
         
         @NearBindgen({})
         class GreetContract {
             @call({})
             create_greeting({ message }: {
                 message: string
             }): NearPromise {
                 return NearPromise.new('${guestBookAccount}')
                     .functionCall("leave_message", JSON.stringify({message: \`new message: "\${message}" from "\${near.signerAccountId()}" through "\${near.currentAccountId()}"\` }), NO_DEPOSIT, FIVE_TGAS)
                     .then(
                         NearPromise.new(near.currentAccountId())
                             .functionCall("create_greeting_callback", NO_ARGS, NO_DEPOSIT, FIVE_TGAS)
                     )
             }

             @call({ privateFunction: true })
             create_greeting_callback(): boolean {
                 let {result, success} = promiseResult()
                 if (success) {
                     return true
                 } else {
                     return false
                 }
             }
         }
         
         function promiseResult(): {result?: string[], success: boolean}{
          let result, success;
          
          try {
            result = near.promiseResult(0);
            success = true
          } catch {
            result = undefined;
            success = false
          }

          
          return {result, success}
        }
       `;

      beforeEach(async () => {
        nearMock = new NearSdkMock();
      });

      it('calls another Contract', async () => {
        nearMock.addAccount(guestBookAccount, 1_000_000_000n);
        nearMock.addAccount(greetAccount, 1_000_000_000n);
        nearMock.addAccount('alice.near', 1_000_000_000n);
        nearMock.addAccount('bob.near', 1_000_000_000n);

        await nearMock.deploy(guestBookAccount, guestBookContract);
        await nearMock.deploy(greetAccount, greetContract);

        expect(nearMock.view(guestBookAccount, 'get_messages')).to.deep.equal([]);

        expect(
          await nearMock.call(guestBookAccount, 'alice.near', 'leave_message', {
            message: 'hi, i am Alice',
          }),
        ).to.deep.equal([{ from: 'alice.near', message: 'hi, i am Alice' }]);

        expect(
          await nearMock.call(guestBookAccount, 'bob.near', 'leave_message', {
            message: 'hi, i am Bob',
          }),
        ).to.deep.equal([
          { from: 'alice.near', message: 'hi, i am Alice' },
          { from: 'bob.near', message: 'hi, i am Bob' },
        ]);

        expect(nearMock.view(guestBookAccount, 'get_messages')).to.deep.equal([
          { from: 'alice.near', message: 'hi, i am Alice' },
          { from: 'bob.near', message: 'hi, i am Bob' },
        ]);

        await nearMock.call(greetAccount, 'bob.near', 'create_greeting', {
          message: 'Yes',
        });

        expect(nearMock.view(guestBookAccount, 'get_messages')).to.deep.equal([
          { from: 'alice.near', message: 'hi, i am Alice' },
          { from: 'bob.near', message: 'hi, i am Bob' },
          {
            from: 'bob.near',
            message: 'new message: "Yes" from "bob.near" through "greet.near"',
          },
        ]);
      });

      it('call twice - promise.then()', async () => {
        const greetTwiceContract = `
         import { NearBindgen, NearPromise, call, view, near } from 'near-sdk-js';
        
         const FIVE_TGAS = BigInt(50000000000000);
         const NO_DEPOSIT = BigInt(0);
         const NO_ARGS = JSON.stringify({});
         
         @NearBindgen({})
         class GreetTwiceContract {
             @call({})
             create_greeting_twice({ message }: {
                 message: string
             }): NearPromise {
                 return NearPromise.new('${guestBookAccount}')
                     .functionCall("leave_message", JSON.stringify({message: \`first message: "\${message}"\` }), NO_DEPOSIT, FIVE_TGAS)
                     .then(NearPromise.new('${guestBookAccount}').functionCall("leave_message", JSON.stringify({message: \`second message: "\${message}"\` }), NO_DEPOSIT, FIVE_TGAS));
             }
         }
       `;

        nearMock.addAccount(guestBookAccount);
        nearMock.addAccount(greetAccount);
        nearMock.addAccount('alice.near');

        await nearMock.deploy(guestBookAccount, guestBookContract);
        await nearMock.deploy(greetAccount, greetTwiceContract);

        expect(nearMock.view(guestBookAccount, 'get_messages')).to.deep.equal([]);

        await nearMock.call(greetAccount, 'alice.near', 'create_greeting_twice', {
          message: 'hi, i am Alice',
        });

        expect(nearMock.view(guestBookAccount, 'get_messages')).to.deep.equal([
          {
            from: 'alice.near',
            message: 'first message: "hi, i am Alice"',
          },
          {
            from: 'alice.near',
            message: 'second message: "hi, i am Alice"',
          },
        ]);
      });

      it('call twice - functionCall chaining', async () => {
        const greetTwiceContract = `
         import { NearBindgen, NearPromise, call, view, near } from 'near-sdk-js';
        
         const FIVE_TGAS = BigInt(50000000000000);
         const NO_DEPOSIT = BigInt(0);
         const NO_ARGS = JSON.stringify({});
         
         @NearBindgen({})
         class GreetTwiceContract {
             @call({})
             create_greeting_twice({ message }: {
                 message: string
             }): NearPromise {
                 return NearPromise.new('${guestBookAccount}')
                     .functionCall("leave_message", JSON.stringify({message: \`first message: "\${message}"\` }), NO_DEPOSIT, FIVE_TGAS)
                     .functionCall("leave_message", JSON.stringify({message: \`second message: "\${message}"\` }), NO_DEPOSIT, FIVE_TGAS)
             }
         }
       `;

        nearMock.addAccount(guestBookAccount);
        nearMock.addAccount(greetAccount);
        nearMock.addAccount('alice.near');

        await nearMock.deploy(guestBookAccount, guestBookContract);
        await nearMock.deploy(greetAccount, greetTwiceContract);

        expect(nearMock.view(guestBookAccount, 'get_messages')).to.deep.equal([]);

        await nearMock.call(greetAccount, 'alice.near', 'create_greeting_twice', {
          message: 'hi, i am Alice',
        });

        expect(nearMock.view(guestBookAccount, 'get_messages')).to.deep.equal([
          {
            from: 'alice.near',
            message: 'first message: "hi, i am Alice"',
          },
          {
            from: 'alice.near',
            message: 'second message: "hi, i am Alice"',
          },
        ]);
      });

      it('call twice - promise.and()', async () => {
        const greetTwiceContract = `
         import { NearBindgen, NearPromise, call, view, near } from 'near-sdk-js';
        
         const FIVE_TGAS = BigInt(50000000000000);
         const NO_DEPOSIT = BigInt(0);
         const NO_ARGS = JSON.stringify({});
         
         @NearBindgen({})
         class GreetTwiceContract {
             @call({})
             create_greeting_twice({ message }: {
                 message: string
             }): NearPromise {
                 const promise = NearPromise.new('${guestBookAccount}')
                     .functionCall("leave_message", JSON.stringify({message: \`first message: "\${message}"\` }), NO_DEPOSIT, FIVE_TGAS)
                     .and(NearPromise.new('${guestBookAccount}').functionCall("leave_message", JSON.stringify({message: \`second message: "\${message}"\` }), NO_DEPOSIT, FIVE_TGAS))
                     .then(
                         NearPromise.new(near.currentAccountId())
                             .functionCall("create_greeting_callback", NO_ARGS, NO_DEPOSIT, FIVE_TGAS)
                     )

                  return promise;
             }

             @call({ privateFunction: true })
             create_greeting_callback(): boolean {
                 let {result, success} = promiseResult()
                 if (success) {
                     return true
                 } else {
                     return false
                 }
             }
         }
         
         function promiseResult(): {result?: string[], success: boolean}{
          let result, success;
          
          try {
            result = near.promiseResult(0);
            near.log(result);
            success = true
          } catch {
            result = undefined;
            success = false
          }

          
          return {result, success}
        }
       `;

        nearMock.addAccount(guestBookAccount);
        nearMock.addAccount(greetAccount);
        nearMock.addAccount('alice.near');

        await nearMock.deploy(guestBookAccount, guestBookContract);
        await nearMock.deploy(greetAccount, greetTwiceContract);

        expect(nearMock.view(guestBookAccount, 'get_messages')).to.deep.equal([]);

        await nearMock.call(greetAccount, 'alice.near', 'create_greeting_twice', {
          message: 'hi, i am Alice',
        });

        expect(nearMock.view(guestBookAccount, 'get_messages')).to.deep.equal([
          {
            from: 'alice.near',
            message: 'first message: "hi, i am Alice"',
          },
          {
            from: 'alice.near',
            message: 'second message: "hi, i am Alice"',
          },
        ]);
      });
    });

    describe('near.promiseResult', () => {
      let nearMock: NearSdkMock;

      const otherContract = `
        import { call, view, near, NearBindgen, NearPromise } from 'near-sdk-js';
        
        @NearBindgen({})
        class OtherContract {
          symbol = 'AGR';
          balances = {};
        
          @call({  })
          pass() {
            return 'test-result';
          }
        
          @call()
          fail() {
            throw new Error('test-error');
          }
        }
      `;

      beforeEach(async () => {
        nearMock = new NearSdkMock();
        await nearMock.deploy('other.test.near', otherContract);
      });

      it('get result from promise', async () => {
        const main = `
          import { call, near, NearBindgen, NearPromise } from 'near-sdk-js';
          
          const GAS = 10_000_000_000_000n;
          
          @NearBindgen({})
          class MainContract {
            @call({})
            run() {
              return NearPromise.new('other.test.near')
                .functionCall('pass', '', 0n, GAS)
                .then(NearPromise.new(near.currentAccountId()).functionCall('callback', '', 0n, GAS));
            }
          
            @call({ privateFunction: true })
            callback() {
              const res = near.promiseResult(0 as any);
              return \`Promise result: \${res}\`;
            }
          }
        `;

        await nearMock.deploy('main.test.near', main);

        const res = await nearMock.call('main.test.near', 'main.test.near', 'run');
        expect(res).to.equal('Promise result: test-result');
      });

      it('ignore promise failure', async () => {
        const main = `
          import { call, near, NearBindgen, NearPromise } from 'near-sdk-js';
          
          const GAS = 10_000_000_000_000n;
          
          @NearBindgen({})
          class MainContract {
            @call({})
            run() {
              return NearPromise.new('other.test.near')
                .functionCall('fail', '', 0n, GAS)
                .then(NearPromise.new(near.currentAccountId()).functionCall('callback', '', 0n, GAS));
            }
          
            @call({ privateFunction: true })
            callback() {
              return 'error-ignored';
            }
          }
        `;

        await nearMock.deploy('main.test.near', main);

        const res = await nearMock.call('main.test.near', 'main.test.near', 'run');
        expect(res).to.equal('error-ignored');
      });
    });
  });
});
