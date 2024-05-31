import chai, { expect } from 'chai';
import { NearWorkspacesMock } from './NearWorkspacesMock';

chai.config.truncateThreshold = 0;

describe('NearWorkspacesMock', () => {
  it('root account balance', async () => {
    const nearWorkspacesMock = new NearWorkspacesMock();
    const { Worker } = nearWorkspacesMock.moduleMock;

    const worker = await Worker.init();
    const balance = await worker.rootAccount.availableBalance();
    expect(balance.toHuman()).equal('1,000,000,000 N');
  });

  it('subaccount balance', async () => {
    const nearWorkspacesMock = new NearWorkspacesMock();
    const { Worker } = nearWorkspacesMock.moduleMock;

    const worker = await Worker.init();
    const alice = await worker.rootAccount.createSubAccount('alice');
    const balance = await alice.availableBalance();
    expect(balance.toHuman()).equal('100 N');
  });

  it('deploy contract', async () => {
    const code = `
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

    const nearWorkspacesMock = new NearWorkspacesMock();
    const { Worker } = nearWorkspacesMock.moduleMock;
    nearWorkspacesMock.deployables.push({ wasm: 'counter.wasm', source: code });

    const worker = await Worker.init();
    const contract = await worker.rootAccount.createSubAccount('counter');
    await contract.deploy('counter.wasm');

    expect(await contract.view('get_count')).to.equal(0);
    await contract.call('counter.test.near', 'increment', {});
    expect(await contract.view('get_count')).to.equal(1);
  });
});
