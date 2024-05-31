After completing previous lessons, you should have a good understanding of how to perform asynchronous operations in NEAR smart contracts. To conclude the course, we will examine an example of swapping fungible tokens between two accounts, a common operation in decentralized finance (DeFi) applications.

This is an interesting case study, because it demonstrates what makes programming for NEAR different from programming for other blockchains like Ethereum.

The requirements are simple: Alice wants to exchange her `ABC` tokens for Bob's `XYZ` tokens. To make our lives easier, we will assume that the exchange rate is `1:1`, meaning one `ABC` token will be exchanged for one `XYZ` token.

On Ethereum, this could be achieved with a straightforward smart contract that calls the `transfer` method on both tokens' smart contracts. If one of the transfers fails, the entire operation would be rolled back.

On NEAR, this is not possible. Cross-contract calls are asynchronous. If one of the calls fails, the other will still succeed. Any transactional guarantees must be implemented within the contract itself.

This may seem like a limitation, but it is actually a trade-off that allows NEAR to process more transactions than Ethereum. As of 2024, Ethereum is in theory able to handle 100 transactions per second, while NEAR can already handle 2,000. And this is just the beginning. NEAR can increase its throughput simply by adding more shards, eventually enabling it to handle hundreds of thousands of transactions per second.

A naive implementation of the token swap contract might look like this:

```typescript
@NearBindgen({})
class TokenSwap {
  @call({})
  swap() {
    return NearPromise.new('abc.near')
      .functionCall(
        'ft_transfer',
        JSON.stringify({ receiver_id: 'bob.near', amount: '100' }),
        DEPOSIT,
        GAS,
      )
      .and(
        NearPromise.new('xyz.near').functionCall(
          'ft_transfer',
          JSON.stringify({ receiver_id: 'alice.near', amount: '100' }),
          DEPOSIT,
          GAS,
        ),
      );
  }
}
```

Take a minute and think about what's wrong with this code and how you would fix it.

The first issue is that the code does not check if both parties have enough tokens to perform the swap. If Alice doesn't have enough `ABC` tokens, the contract will still transfer `XYZ` tokens to Bob. Even if we added a check at the beginning of the method, it might not be enough. By the time `ft_transfer` calls are executed, the balances could have changed.

Another approach would be to add a callback method after the `ft_transfer` calls and to roll back both operations if one of them fails. The rollback would be implemented by transferring the tokens back to the original owner. However, there is no guarantee that the rollback will succeed; the tokens may already be gone by the time we attempt to transfer them back.

The correct solution is to make sure that the swap itself happens synchronously on a single shard. This can be achieved by requiring Alice and Bob to lock their tokens in the `TokenSwap` contract before the swap. The contract will then check if both parties have locked the tokens and only then perform the swap.

## Exercise

In this exercise, you will implement the swap contract described above. We have prepared a boilerplate for you and implemented one test case that shows you the whole swap process.

1. [ ] Implement the `ft_on_transfer` method, which is called when Alice or Bob transfers tokens to the `TokenSwap` contract.
2. [ ] Implement the `swap` method.
3. [ ] Implement the `ft_withdraw` method to allow Alice and Bob to withdraw their newly obtained tokens from the contract.
4. [ ] Add as many test cases as you need to ensure that the contract works as expected.
