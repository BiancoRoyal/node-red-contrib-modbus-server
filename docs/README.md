# Modbus Server Documentation

Learning material for `@plus4nodered/node-red-contrib-modbus-server`.

Polling / read timing uses Node-RED **Inject** nodes (`repeat`), not a built-in poll rate on a read node.

## Prerequisites

- Node-RED **>= 4**
- Node.js **>= 20**
- This package installed in your Node-RED user directory

```bash
cd ~/.node-red
npm install @plus4nodered/node-red-contrib-modbus-server
```

## Nodes in this package

| Node | Purpose |
|------|---------|
| **Modbus-Server** | Standard Modbus TCP server (holding, coils, input, discrete) |
| **Modbus-Server-Demo** | Server with automatic demo data generation |
| **Modbus-Server-TLS** | TLS-secured Modbus TCP server (optional demo mode) |

## Learning path

Import the numbered JSON files from [`examples/`](../examples/) via Node-RED **Menu → Import**. Use the Inject buttons and Comment nodes in each flow for the next steps.

| # | Flow | What you learn | Docs |
|---|------|----------------|------|
| 01 | `01-hello-modbus-server.json` | Start a Modbus TCP server and see its 5 outputs | [01-getting-started.md](./01-getting-started.md) |
| 02 | `02-write-server-memory.json` | Write holding/coils/input/discrete via Node-RED input | [02-server-memory.md](./02-server-memory.md) |
| 03 | `03-observe-server-buffers.json` | Observe buffer outputs after memory writes | [02-server-memory.md](./02-server-memory.md) |
| 04 | `04-demo-server-patterns.json` | Demo server patterns, start/stop/reset via Inject | [03-demo-server.md](./03-demo-server.md) |
| 05 | `05-tls-secure-server.json` | TLS server basics (demo mode / certs) | [04-tls-server.md](./04-tls-server.md) |
| 06 | `06-test-with-modbus-client.json` | Test with Modbus **client** package v6+ | [05-testing-with-client.md](./05-testing-with-client.md) |

## Optional client package

This package provides **servers only**. For example `06` (and any client reads/writes from Node-RED):

```bash
npm install @plus4nodered/node-red-contrib-modbus@^6
```

Use Inject nodes to trigger reads/writes. Poll timing belongs on the Inject (`repeat`), not as a hidden interval on the read node.

## Example design rules

- Small register buffers
- One dedicated TCP port per example
- Inject drives timing
- Core Node-RED nodes for learning (`inject`, `debug`, `function`, `comment`)
- Client nodes only in example `06` (optional dependency)
