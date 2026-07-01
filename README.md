# non-cancel-failover-balancer

A failover balancer that tries the next node when the current one times out — without cancelling previous requests. The first node to succeed wins, regardless of order.

## Install

```bash
npm install non-cancel-failover-balancer
```

## Usage

```js
import { nonCancelFailoverBalancer } from "non-cancel-failover-balancer";

const balancer = nonCancelFailoverBalancer({ timeoutMs: 500 });

const result = await balancer.run(
    () => fetch("https://node1.example.com/data"),
    () => fetch("https://node2.example.com/data"),
    () => fetch("https://node3.example.com/data"),
);
```

Each function is called lazily — node2 only starts after node1 times out, node3 only starts after node2 times out. All started requests keep running; the first to resolve wins.

## Example

```js
import { nonCancelFailoverBalancer } from "non-cancel-failover-balancer";

function mockFetch(value, delayMs) {
    return new Promise(resolve => setTimeout(resolve, delayMs, value));
}

const balancer = nonCancelFailoverBalancer({ timeoutMs: 500 });

const result = await balancer.run(
    () => mockFetch("node1 result", 600), // starts at t=0ms,   responds at t=600ms
    () => mockFetch("node2 result", 300), // starts at t=500ms, responds at t=800ms
);

console.log(result);
```

**Output:**
```
node1 result
```

**Timeline:**
```
t=   0ms  node1 starts
t= 500ms  node1 timed out → node2 starts
t= 600ms  node1 responds  ← wins (still running, responds first)
t= 800ms  node2 responds  (ignored)
```

## API

### `nonCancelFailoverBalancer(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `timeoutMs` | `number` | `500` | How long to wait before starting the next node |

Returns `{ run }`.

### `balancer.run(...funcs)`

Each argument must be a **function** that returns a Promise (not a Promise directly — it must be lazy so execution is deferred).

Resolves with the first successful result. Throws `"All attempts failed"` if every node fails.
