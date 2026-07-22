# 05 — Testing with the Modbus client package

## Goal

Verify that the Modbus **server** answers real Modbus TCP requests from a Node-RED **client**.

## Required package

Install **at least v6** of the client package:

```bash
cd ~/.node-red
npm install @plus4nodered/node-red-contrib-modbus@^6
```

Then restart Node-RED and import:

[`examples/06-test-with-modbus-client.json`](../examples/06-test-with-modbus-client.json)

## Pattern used in the example

```
Inject (repeat) → Modbus Read/Write → Debug
                      ↑
              Modbus Client (TCP → 127.0.0.1:10506)
                      ↑
              Modbus Server (this package)
```

- **Inject** provides the poll interval (`repeat`)
- Server seed data can be written via Function → Server input
- Client package nodes perform FC reads/writes against the server

## Notes

- Example `06` is optional for this package’s unit tests if the client is not installed
- Keep both server and client on the same host/port settings
- Prefer small quantities and modest Inject intervals to avoid queue pressure
