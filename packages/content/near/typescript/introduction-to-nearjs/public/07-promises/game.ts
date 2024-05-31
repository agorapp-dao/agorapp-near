import { NearBindgen, call, near, NearPromise } from 'near-sdk-js';

@NearBindgen({})
class Game {
  players: string[] = [];
  joinFee = 1_000_000n;

  @call({ payableFunction: true })
  join() {
    if (near.attachedDeposit() !== this.joinFee) {
      throw new Error(`Join fee is ${this.joinFee} yoctoNEAR`);
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

  // your code here
}
