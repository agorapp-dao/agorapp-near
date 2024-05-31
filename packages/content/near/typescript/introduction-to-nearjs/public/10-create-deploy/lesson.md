### Creating accounts

On the NEAR blockchain, accounts can have subaccounts. For example, for the contract `trading-platform.near`, you can create subaccounts like `alice.trading-platform.near` and `bob.trading-platform.near`.

Subaccounts can be created manually using the [NEAR CLI](https://docs.near.org/tools/near-cli) or programmatically from your smart contract:

```typescript
@NearBindgen({})
class TradingPlatform {
  @call({})
  create_account({ name }: { name: string }) {
    return NearPromise.new(`${name}.trading-platform.near`) // or `${name}.${near.currentAccountId()}`
      .createAccount()
      .addFullAccessKey(new PublicKey(near.signerAccountPk()));
  }
}
```

In the example above, we have a smart contract deployed at `trading-platform.near`. The `create_account` method creates a new subaccount named `xxx.trading-platform.near` and grants the caller full access to this new account by using their public key.

Creating accounts programmatically has many uses cases. Here are a few examples:

- You can create an account for each user of your application to store their data.
- Subaccounts can hold NEAR tokens.
- You can deploy smart contracts to subaccount.

### Deploying contracts

With the NEAR SDK, you can also deploy smart contracts programmatically. In this scenario, your smart contract acts effectively as a factory for other smart contracts.

Let's demonstrate this on an example. We will extend our `TradingPlatform` contract with a method called `create_coin`, which creates a new cryptocurrency coin that can be traded on the platform:

```typescript
const CODE = includeBytes('./fungible_token.wasm');
const INITIAL_BALANCE = BigInt(3_000_000_000_000_000_000_000_000);

@NearBindgen({})
class TradingPlatform {
  @call({})
  create_coin({ symbol }: { symbol: string }) {
    return NearPromise.new(`${name}.trading-platform.near`) // or `${name}.${near.currentAccountId()}`.
      .createAccount()
      .addFullAccessKey(new PublicKey(near.signerAccountPk()))
      .transfer(INITIAL_BALANCE)
      .deployContract(code);
  }
}
```

This code is very similar to the previous example, but with two new additions:

1. We transfer some NEAR tokens to the new account. This is necessary because the new account needs funds to pay for its operation and storage.

2. Smart contracts on the NEAR blockchain are compiled into WebAssembly before deployment. This allows NEAR to support multiple programming languages for contract development. The currently supported languages are:

- JavaScript - see [JavaScript SDK](https://docs.near.org/sdk/js/introduction) for more details.
- Rust - see [Rust SDK](https://docs.near.org/sdk/rust/introduction) for more details.

For JavaScript you can compile your contract to WebAssembly easily with JavaScript SDK like this:

```
near-sdk-js build src/trading-platform.ts build/trading_platform.wasm
```

After compiling, you load the WebAssembly file into memory with the `includeBytes` function and deploy it to the newly created account using the `deployContract` method.

## Exercise

Currently, the only way to start a new game is to deploy a `Game` contract manually. This is not very user-friendly. In this exercise, you will implement a method that will deploy a new `Game` contract automatically.

Finish the implementation of the `start` method on the `GameManager` contract:

1. [ ] Create a unique subaccount for the game (`*.game.near`).
2. [ ] Deploy the `Game` contract on the newly created subaccount.
