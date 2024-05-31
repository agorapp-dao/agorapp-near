## Prerequisites

To solve this challenge you should be familiar with how cross-contract calls work. If you are not, we recommend you to check out the [Asynchronous programming](/course/async-programming) course first.

## TipStream Contract

TipStream is a fictional social network where users can tip each other with NEAR tokens. The tipping mechanism is governed by a smart contract named `tip-stream.near`.

To engage in tipping, users must initially deposit tokens into the contract. This method, as opposed to direct wallet-to-wallet tipping, offers benefits such as increased security and user convenience.

The `tip-stream.near` contract contains three methods:

- `near_deposit` - Allows users to deposit NEAR tokens in the contract.
- `tip` - Enables users to tip each other
- `near_withdraw` - Allows users to withdraw NEAR tokens from the contract back to their wallet.

## Challenge

The implementation for the TipStream contract is in the `tip-stream.ts` file. It contains a serious security vulnerability that could allow attacker to steal the funds locked in the contract.

You know that Alice has deposited 1,000,000,000 tokens into the TipStream contract. You also know that Alice loves free NFTs, and you are able to manipulate her into calling the `claim_free_nft` method on your contract.

With this information, are you able to steal Alice's tokens?

To explore and test your solution, you can utilize the **Transactions** panel located at the bottom. This tool allows you to interact with the contract by experimenting with various inputs and method calls.

Once you have the solution, submit it by clicking the **Submit** button.
