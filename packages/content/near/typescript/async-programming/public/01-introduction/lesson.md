Programming smart contracts on NEAR blockchain is in many respects similar to programming contract on other chains. Contracts are deployed to the blockchain and can be called by users or other contracts. Each contract has an account associated with it, which can hold NEAR tokens and store data.

However, there is one point where NEAR differs: many operations performed in the contract code are asynchronous. This requires a different approach to smart contract programming, especially if you are coming from a synchronous smart contract environment like Ethereum.

### Prequisites

In this course, we assume that you already know the basics of NEAR smart contract programming. If you are not familiar with it, please take a look at [our introductory course](/course/introduction-to-nearjs).

You might also find [NEAR documentation for the JS SDK](https://docs.near.org/sdk/js/introduction) useful.

### Fungible tokens

This course will revolve around the concept of fungible tokens. NEAR provides you with a set of [Primitives](https://docs.near.org/build/primitives/what-is). These are standards that tell you how to implement certain functionalities on the NEAR blockchain.

In this course, we will focus on the fungible token standard. This standard is used to create tokens (coins) that are interchangeable with each other. For example, if I hold 10 AGORA tokens and you hold 10 AGORA tokens, we can exchange them, and it will not make any difference. This is why they are called "fungible."

You might have also heard about non-fungible tokens (NFTs). These are tokens that are unique and cannot be exchanged with one another. For instance, if I have a token representing a piece of art, and you have a token representing a piece of music, we cannot exchange them directly. They are different things and their value is probably different as well.

A fungible token in the context of NEAR is just a smart contract that implements the fungible token standard. Conceptually, it is pretty simple. It's a contract that holds a map of token balances for each account and provides a function to transfer tokens between accounts:

```typescript
@NearBindgen({})
class FungibleToken {
  symbol: string;
  balances = new LookupMap<bigint>('balances');

  @call({})
  ft_transfer({ receiver_id, amount }: { receiver_id: string; amount: string }) {
    const sender_id = near.predecessorAccountId();
    const sender_balance = this.balances.get(sender_id) ?? 0n;
    const receiver_balance = this.balances.get(receiver_id) ?? 0n;

    this.balances.set(sender_id, sender_balance - amount);
    this.balances.set(receiver_id, receiver_balance + amount);
  }
}
```

Of course, this is an extremely simplified version of the contract. In reality, there are many more things you need to consider, such as balance checks, minting and burning of tokens, etc. But you get the basic idea.

## Exercise

We will start with a simple faucet contract. The contract will have a method that allows anyone to get some fungible tokens.

Fungible token contract is deployed at address `agr-token.test.near`.

Finish an implementation of the `withdraw` method:

1. [ ] Transfer the requested amount of token to the caller.
2. [ ] Increase the withdrawal counter by one.
