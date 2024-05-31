Welcome to the Introduction to NEAR JavaScript SDK. In this course, you will learn the fundamentals of the NEAR Blockchain and how to utilize the NEAR JavaScript SDK to build smart contracts on NEAR.

## What is NEAR?

NEAR is a decentralized blockchain project governed by the NEAR Foundation. The goal of the project is to provide a user-friendly platform that hosts applications and smart contracts in a decentralized way.

There are a couple of things that make NEAR stand out:

- Easy to remember account names (e.g., `alice.near`)
- Fast and cheap transactions
- Integration with other blockchains
- Developer-friendly tools
- Capability to host entire applications on the chain, including the UI

In this course, we will focus on the backend part of the application, typically referred to as a smart contract. Smart contracts are programs that run on the blockchain.

## NEAR JavaScript SDK

NEAR currently supports two programming languages for authoring smart contracts: Rust and JavaScript. Our focus for this course will be on JavaScript.

To write and interact with contracts in JavaScript we will use JavaScript SDK.

## TypeScript

The NEAR JavaScript SDK is designed to work with TypeScript, a superset of JavaScript that introduces static typing to the language. TypeScript has gained popularity as a language for developing web applications.

This course assumes that you are already familiar with TypeScript. If you are not, you can learn more about it [here](https://www.typescriptlang.org/).

## Hello, World!

Let's start with an obligatory hello world example:

```typescript
import { NearBindgen, view } from 'near-sdk-js';

@NearBindgen({})
class HelloNear {
  @view({})
  get_greeting(): string {
    return 'Hello, World!';
  }
}
```

This is a simple smart contract that exposes a method called `get_greeting`, which returns the string `'Hello, World!'`.

Notice that the class is decorated with the `@NearBindgen` decorator. This is how the NEAR runtime can tell that this class is a smart contract that should be exposed to the outer world.

The `@view` decorator tells the runtime that this method is a view method. We will talk about view methods later in the course.

## Exercise

Our goal in this course is to build a simple counter smart contract.

Let's start by creating a basic contract scaffold:

1. [ ] Create a contract class called `Counter` and make sure it's marked as a smart contract.

2. [ ] Add a view method called `get_count` that returns a number `0`.
