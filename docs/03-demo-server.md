# 03 — Demo server

## Goal

Use **Modbus-Server-Demo** to generate changing register values for development and demos.

## Import

[`examples/04-demo-server-patterns.json`](../examples/04-demo-server-patterns.json)

## Patterns

Configured on the node (or via input):

- `sequential`, `random`, `sine`, `square`, `sawtooth`, `mixed`

## Control via Inject

Send a string payload:

| Payload | Effect |
|---------|--------|
| `startdemo` | Start data generation |
| `stopdemo` | Stop data generation |
| `reset` | Reset counter and refresh data |
| `stop` / `start` | Stop / start TCP server |

Or send an object to change config, e.g.:

```javascript
msg.payload = { pattern: 'sine', interval: 2000, min: 0, max: 1000 }
return msg
```

## Stability tips

- Prefer moderate update intervals (≥ 500 ms) for demos
- Keep buffer sizes modest in learning flows
- Stop the demo (`stopdemo`) when you leave the flow idle for long

## Next

Continue with [04 — TLS server](./04-tls-server.md).
