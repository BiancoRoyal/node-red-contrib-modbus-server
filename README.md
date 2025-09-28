# node-red-contrib-modbus-server

Modbus Server nodes for Node-RED - separated from the main node-red-contrib-modbus package for improved security and modularity.

## Installation

```bash
npm install @plus4nodered/node-red-contrib-modbus-server
```

## Features

This package provides Modbus server functionality for Node-RED:

- **Modbus-Server**: Standard Modbus TCP server
- **Modbus-Server-TLS**: TLS-secured Modbus TCP server
- **Modbus-Server-Demo**: Demo server for testing

## Why a Separate Package?

The server functionality has been extracted from the main `node-red-contrib-modbus` package to:

1. **Improve Security**: Remove the `jsmodbus` dependency from the main package
2. **Reduce Size**: Users who only need client functionality get a smaller package
3. **Modularity**: Install only what you need
4. **Independent Updates**: Server and client can be updated independently

## Migration from node-red-contrib-modbus

If you're upgrading from node-red-contrib-modbus v5.x or earlier:

```bash
# Install both packages if you need server functionality
npm install @plus4nodered/node-red-contrib-modbus
npm install @plus4nodered/node-red-contrib-modbus-server
```

Your existing flows will continue to work after installing both packages.

## Usage

The nodes work exactly as they did in the combined package. Simply:

1. Install this package
2. Restart Node-RED
3. Find the Modbus server nodes in the Node-RED palette
4. Use them in your flows as before

## Documentation

For detailed documentation, see the main package documentation:
- [node-red-contrib-modbus](https://github.com/biancoroyal/node-red-contrib-modbus)

## License

BSD-3-Clause

## Author

Klaus Landsdorf <klaus.landsdorf@bianco-royal.de>

## Support

For support, please visit:
- [GitHub Issues](https://github.com/biancoroyal/node-red-contrib-modbus-server/issues)
- [Plus for Node-RED](http://plus4nodered.com/)