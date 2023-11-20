In the previous lesson, we learned how to create a simple state variable. However, in the real world, we often need to store more complex data.

Imagine the following scenario: we launch a challenge where users compete with each other, and we want to store the score of each user. A naive JavaScript implementation might look something like this:

```typescript
import { NearBindgen, near, call, view } from 'near-sdk-js';

@NearBindgen({})
class ChallengeContract {
  // key is userId, value is score
  scores = new Map<string, number>();

  @call({})
  evaluateScore({ message }): void {
    const userId = near.signerAccountId();
    const score = // some logic to come up with a score...
      this.scores.set(userId, score);
  }
}
```

This implementation works, but it has one problem: every time the `evaluateScore` method is called, the entire `scores` map is deserialized from the blockchain to memory, updated, and then serialized back to the blockchain. This process can be quite expensive, especially once the map contains many entries.

A much better solution would be to load and save only the map entry needed in the `evaluateScore` method. This is where NEAR collections come into play.

NEAR collections are optimized for storing data on the blockchain. The previous challenge example can be rewritten to use NEAR's `LookupMap` collection:

```typescript
import { NearBindgen, near, call, view, LookupMap } from 'near-sdk-js';

@NearBindgen({})
class ChallengeContract {
  // key is userId, value is score
  scores = new LookupMap<number>('scores');

  @call({})
  evaluateScore({ message }): void {
    const userId = near.signerAccountId();
    const score = // some logic to come up with a score...
      this.scores.set(userId, score);
  }
}
```

This implementation is pretty similar to the first one, but there are a few differences:

- `scores` is now a `LookupMap` instead of a `Map`
- `LookupMap` is initialized with the string `"scores"`. This string is used as a prefix for keys when map values are stored on the blockchain.
- Keys for `LookupMap` must always be of type `string`.

With this implementation, we no longer load the entire scores map to the memory.

There are more collection types in the NEAR JavaScript SDK. See documentation for the [full list](https://docs.near.org/sdk/js/contract-structure/collections).

## Exercise

In this lesson, we will extend the `Counter` contract to have the ability to store multiple counters:

1. [ ] Add state variable `counters` that maps `string` keys to number values.

2. [ ] Modify the `get_count` method to accept a parameter `key` and return the value associated with that key.

3. [ ] Modify the `increment` method to accept a parameter `key` and increment the value of the counter with that key.
