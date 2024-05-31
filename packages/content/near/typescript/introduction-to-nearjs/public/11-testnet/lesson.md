This is the final lesson of the course, and it will be slightly different. We will show you how to build, deploy, and interact with a real smart contract.

You will be trying this on your own computer, but don't worry, we will guide you through the process.

You will need to have [Node.js](https://nodejs.org/en/download/) installed. The latest version should work just fine.

To create a new smart contract project, run the following command:

```
npx create-near-app
```

Replace the generated contract code with the following:

```typescript
import { NearBindgen, call, NearPromise } from 'near-sdk-js';

// maximum gas we are willing to pay for the function call
const GAS = 50_000_000_000_000n;
// no deposit attached to the function call
const NO_DEPOSIT = 0n;

@NearBindgen({})
class HelloNear {
  @call({})
  hello() {
    return NearPromise.new('intro-to-near.agorapp.testnet').functionCall(
      'get_secret',
      '',
      NO_DEPOSIT,
      GAS,
    );
  }
}
```

Now compile the contract to WebAssembly:

```
npm run build
```

### Testnet

It would not be practical to test your contract on the real NEAR network, as that would require spending real money. Instead, we will use the NEAR testnet, which is identical to the real network but uses test tokens that have no real-world value.

First, create a new user account with a wallet at: https://testnet.mynearwallet.com/

To get some NEAR tokens for testing, you can use the NEAR faucet: https://near-faucet.io/

You will also need to install the [NEAR CLI](https://docs.near.org/tools/near-cli), which you will use to interact with the NEAR network:

```
npm install -g near-cli
```

Login to your wallet account using the NEAR CLI:

```
near login
```

Now you're ready to create a testnet account where you will deploy your contract:

```
near create-account hello-contract.your-wallet-account.testnet --useAccount your-wallet-account.testnet  --useFaucet
```

Note that using `--useFaucet` will automatically deposit some free tokens into the newly created account.

To deploy your contract to the testnet, run the following command:

```
near deploy hello-contract.your-wallet-account.testnet build/hello_near.wasm
```

At this stage, you might get an error message saying that the target account does not have enough tokens:

```
Error: The account hello-contract.your-wallet-account.testnet wouldn't have enough balance to cover storage, required to have 4163660723375883000000000 yoctoNEAR more
```

If that happens, simply transfer more tokens to the contract account from your wallet.

Now you're ready to call the `hello` method of your contract using the NEAR CLI:

```
near call hello-contract.your-wallet-account.testnet hello --useAccount your-wallet-account.testnet --gas=300000000000000
```

This call will return a secret value. Enter the returned secret into the `secret` variable on the right and press the Submit button to finish the course.
