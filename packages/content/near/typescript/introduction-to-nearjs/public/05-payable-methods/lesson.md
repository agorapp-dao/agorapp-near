In this and the following lesson, you will discover why smart contracts are sometimes referred to as programmable money. You will learn how to create a contract that can receive tokens and how to transfer tokens from a contract to another account.

### NEAR token

The native currency on the NEAR blockchain is the NEAR token. NEAR tokens are used to pay for transaction fees and storage on the NEAR blockchain. They can also be traded on cryptocurrency exchanges. At the time of writing, 1 NEAR token is worth around $8.

1 NEAR token can be divided into `10^24` parts, which are called yoctoNEAR. This means that `1 NEAR` is equal to `1,000,000,000,000,000,000,000,000 yoctoNEAR`.

When working with large numbers in JavaScript, you will run into an interesting problem. The largest integer that can be represented safely in JavaScript is `9,007,199,254,740,991`. Beyond this value, you start to lose accuracy. Try it yourself in the browser console:

```typescript
9007199254740991 + 2;
// produces 9007199254740992
```

This behavior is due to JavaScript's use of floating-point numbers. For more details about this behavior, visit [Why don’t my numbers add up?](https://floating-point-gui.de/)

To work with large integers in JavaScript, you should use the `BigInt` type. There are several ways how to define a `BigInt`:

```typescript
const largeNumber1 = 9007199254740991n;
const largeNumber2 = BigInt(200);
const largeNumber3 = BigInt('9007199254740991');

9007199254740991n + 2n;
// produces 9007199254740993n
```

### Payable methods

Both user and contract accounts can hold NEAR tokens. A user can transfer tokens to a contract by attaching them to a method call.

To receive tokens in a contract, the method must be marked as payable:

```typescript
@call({ payableFunction: true })
near_deposit() {
  console.log(`Received ${near.attachedDeposit()} yoctoNEAR tokens`);
  console.log(`Contract now holds ${near.accountBalance()} yoctoNEAR tokens`);
}
```

Contract can use tokens for various purposes:

- It needs tokens to pay for the storage on the NEAR blockchain.
- It can use them to pay for the transaction fees when doing cross-contract calls
- It can send tokens to other user or contract accounts.

Note that `payableFunction` is not the only way how to deposit funds into the contract. You can also send tokens directly from your wallet to the contract account id.

## Exercise

In this and subsequent lessons, we will implement a simple winner-takes-all game, where players first deposit NEAR tokens into a contract, and then the contract selects a random winner who receives all the tokens.

1. [ ] Create a method called `join` that accepts NEAR tokens and stores them in the contract.
2. [ ] User must send exactly `1,000,000` yoctoNEAR to join the game, otherwise the contract should throw an error with a message `Join fee is 1,000,000 yoctoNEAR`.

To explore and test your solution, you can utilize the **Transactions** panel located at the bottom. This tool allows you to interact with the contract and see the account balances.

Once you have the solution, submit it by clicking the **Submit** button.
