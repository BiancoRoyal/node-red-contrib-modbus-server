# 01 — Getting started

## Goal

Run a Modbus TCP server inside Node-RED and understand its outputs.

## Import

[`examples/01-hello-modbus-server.json`](../examples/01-hello-modbus-server.json)

## What the server does

- Listens on TCP (default in the example: **10502** on `127.0.0.1`)
- Holds four register areas: **holding**, **coils**, **input**, **discrete**
- Exposes **5 outputs**:
  1. Holding buffer
  2. Coils buffer
  3. Input buffer
  4. Discrete buffer
  5. Request / echo message

## Try it

1. Deploy the flow
2. Click **Dump buffers** (Inject)
3. Check the Debug sidebar — you should see the five outputs

## Next

Continue with [02 — Server memory](./02-server-memory.md).
