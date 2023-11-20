Each contract deployed on the NEAR blockchain maintains a state that is being persisted across invocations of its methods.

Every value property of the contract class is automatically stored in the state:

```typescript
@NearBindgen({})
class HelloNear {
  // state variable message with the initial value set to "Hello"
  message = 'Hello';
}
```

Under the hood, the values are serialized into a binary format and stored in a key-value store. For more information, see [Serialization](https://docs.near.org/develop/contracts/serialization).

The state can be accessed by view methods and modified by call methods:

```typescript
@NearBindgen({})
class HelloNear {
  message = 'Hello';

  // This method is read-only and can be called for free
  @view({})
  get_greeting(): string {
    return this.message;
  }

  // This method changes the state, for which it cost gas
  @call({})
  set_greeting({ message }: { message: string }): void {
    this.message = message;
  }
}
```

## Exercise

In this lesson we will enhance our `Counter` contract from the previous lesson:

1. [ ] Add a state variable named `count`, initialized to `0`.

2. [ ] Add a call method named `increment` that increases the counter by one.

3. [ ] Modify the `get_count` method to return the current value of the counter.
