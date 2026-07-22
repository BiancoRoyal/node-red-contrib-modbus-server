# 02 — Server memory

## Goal

Write values into the Modbus server memory from Node-RED flows (without a Modbus client).

## Import

- [`examples/02-write-server-memory.json`](../examples/02-write-server-memory.json)
- [`examples/03-observe-server-buffers.json`](../examples/03-observe-server-buffers.json)

## Message format

Send this payload into a **Modbus-Server** node:

```javascript
msg.payload = {
  value: 42,              // number, boolean, or array of bytes
  register: 'holding',    // holding | coils | input | discrete
  address: 0,             // register address
  disableMsgOutput: 0     // 1 = suppress the 5 server outputs
}
return msg
```

### Register notes

| Register | Typical use | Addressing tip |
|----------|-------------|----------------|
| `holding` | Read/write 16-bit values | Address × 2 in buffer |
| `input` | Read-only 16-bit values (from client view) | Address × 2 in buffer |
| `coils` | Read/write bits | Byte-oriented in jsmodbus buffers |
| `discrete` | Read-only bits (from client view) | Byte-oriented in jsmodbus buffers |

## Timing

Use **Inject** with `repeat` if you want periodic updates. Do not rely on a poll rate inside a client read node for learning flows.

## Next

Continue with [03 — Demo server](./03-demo-server.md).
