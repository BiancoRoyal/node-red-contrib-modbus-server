# node-red-contrib-modbus-server

Modbus Server nodes for Node-RED — TCP, TLS and Demo server implementations.

Separated from the main client package for security and modularity.

## Installation

```bash
cd ~/.node-red
npm install @plus4nodered/node-red-contrib-modbus-server
```

Restart Node-RED afterwards.

## Features

| Node | Description |
|------|-------------|
| **Modbus-Server** | Standard Modbus TCP server |
| **Modbus-Server-TLS** | TLS-secured Modbus TCP server |
| **Modbus-Server-Demo** | Demo server with generated register data |

## Learning path

Start here if you are new to Modbus servers in Node-RED: [`docs/README.md`](./docs/README.md).

| Step | Example | Topic |
|------|---------|-------|
| 01 | Hello Modbus Server | Start server, five outputs |
| 02 | Write Server Memory | Holding / coils / input / discrete |
| 03 | Observe Server Buffers | Inject-timed buffer dumps |
| 04 | Demo Server Patterns | Controlled demo generation |
| 05 | TLS Secure Server | TLS demo mode |
| 06 | Test With Modbus Client | Optional client package **v6+** |

Import the numbered JSON files from [`examples/`](./examples/) (e.g. `01-hello-modbus-server.json`) via Node-RED **Menu → Import**.

## Optional client package

This package is **server-only**. To test against a Modbus TCP client in Node-RED:

```bash
npm install @plus4nodered/node-red-contrib-modbus@^6
```

See [docs/05-testing-with-client.md](./docs/05-testing-with-client.md) and example `06`.

## Why a separate package?

1. Keep `jsmodbus` out of the main client package
2. Smaller installs when you only need clients or only need servers
3. Independent release cycles

## Migration from node-red-contrib-modbus ≤ v5

```bash
npm install @plus4nodered/node-red-contrib-modbus@^6
npm install @plus4nodered/node-red-contrib-modbus-server
```

Existing server nodes continue to work after both packages are installed.

## License

BSD-3-Clause

## Author

Klaus Landsdorf &lt;klaus.landsdorf@bianco-royal.de&gt;

## Support

- Issues: repository issue tracker
- [Plus for Node-RED](https://plus4nodered.com/)
