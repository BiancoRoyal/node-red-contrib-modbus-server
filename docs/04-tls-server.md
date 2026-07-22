# 04 — TLS server

## Goal

Run a Modbus TCP server over TLS for secure lab / OT testing.

## Import

[`examples/05-tls-secure-server.json`](../examples/05-tls-secure-server.json)

## Modes

**Modbus-Server-TLS** supports:

1. **Demo mode** — self-signed material for local experiments (example default)
2. **Production-like** — provide private key, certificate, optional CA

Demo options match **Modbus-Server-Demo**: patterns (sequential/random/sine/square/sawtooth/mixed), value range, seed, auto-start, realistic device simulation, and error rate. Control via Inject: `startdemo`, `stopdemo`, `reset`.

## Ports

The example uses port **8502**. Change it if the port is already in use.

## Client testing

Use a TLS-capable Modbus client. With Node-RED, install
`@plus4nodered/node-red-contrib-modbus@^6` and configure the client for TLS.

## Next

Continue with [05 — Testing with client](./05-testing-with-client.md).
