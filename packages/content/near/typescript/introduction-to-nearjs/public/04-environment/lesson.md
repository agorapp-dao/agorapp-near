When a contract's method executes on the NEAR blockchain, it has access to all kinds of information about the environment in which it's running. This includes things like the account ID of the user who invoked the method, the amount of gas attached to the method call, the block timestamp, and so forth.

This information is available through the `near` object. Here are some examples:

- `near.currentAccountId()` - Returns the account ID of the contract that is currently executing.
- `near.prepaidGas()` - Amount of gas available for execution.
- `near.blockTimestamp()` - The timestamp of the current block.
- `near.storageUsage()` - Current storage used by this smart contract.
- `near.usedGas()` - Amount of gas used for execution.

### Signer vs predecessor account

There are two functions that identify the caller of the contract's method:

- `near.signerAccountId()`
- `near.predecessorAccountId()`

To understand the difference between these two, it's important to know that there are two types of accounts on NEAR:

- **user accounts** - These are accounts owned by individual users. Users typically initiate and sign transactions with their wallets.
- **contract accounts** - Each smart contract on NEAR has an account associated with it. This account is owned by the contract itself. When a user calls a method on a smart contract, they are actually sending a transaction to the contract's account. A smart contract account can also call methods on other contracts.

`near.predecessorAccountId()` returns the account ID of the account that called the method. This can be either a user account or a contract account.

`near.signerAccountId()` returns the account ID of the account that actually initiated the transaction. This will typically be a human user with a wallet.

There's one additional point to consider: you can't access the signer and predecessor information in view methods. They are accessible only in call methods.

## Exercise

In this exercise, we will modify the counter contract to provide each human user with a personal counter:

1. [ ] Remove the key argument from the `increment` method and use the account ID of the user, that initiated transaction instead.

2. [ ] Rename the `key` argument of the `get_count` method to `accountId`.
