/**
 * E2E Tests for modbus-server node
 * Uses jsmodbus client directly (server-only package).
 */

'use strict'

const assert = require('assert')
const net = require('net')
const modbus = require('jsmodbus')
const helper = require('node-red-node-test-helper')
const serverNode = require('../../src/modbus-server')
const { getPort } = require('../helper/test-helper-extensions')

helper.init(require.resolve('node-red'))

function connectModbusClient (port) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    const client = new modbus.client.TCP(socket, 1)

    socket.on('error', reject)
    socket.on('connect', () => resolve({ socket, client }))

    socket.connect({ host: '127.0.0.1', port })
  })
}

function closeModbusClient ({ socket }) {
  return new Promise((resolve) => {
    if (!socket || socket.destroyed) {
      resolve()
      return
    }

    socket.once('close', resolve)
    socket.destroy()
    setTimeout(resolve, 500)
  })
}

describe('Modbus Server E2E Tests', function () {
  this.timeout(10000)

  before(function (done) {
    helper.startServer(done)
  })

  afterEach(function (done) {
    helper.unload().then(() => done()).catch(done)
  })

  after(function (done) {
    helper.stopServer(done)
  })

  it('should serve holding register values written via Node-RED input', function (done) {
    getPort().then((port) => {
      const flow = [{
        id: 'server',
        type: 'modbus-server',
        name: 'Test Server',
        hostname: '127.0.0.1',
        serverPort: port,
        responseDelay: 10,
        delayUnit: 'ms',
        coilsBufferSize: 1024,
        holdingBufferSize: 1024,
        inputBufferSize: 1024,
        discreteBufferSize: 1024,
        showStatusActivities: true,
        showErrors: true
      }]

      helper.load([serverNode], flow, function () {
        const modbusServer = helper.getNode('server')

        modbusServer.receive({
          payload: {
            register: 'holding',
            address: 0,
            value: 42,
            disableMsgOutput: 1
          }
        })

        setTimeout(async function () {
          let connection

          try {
            connection = await connectModbusClient(port)
            const resp = await connection.client.readHoldingRegisters(0, 1)
            assert.strictEqual(resp.response.body.valuesAsArray[0], 42)
            await closeModbusClient(connection)
            done()
          } catch (err) {
            if (connection) {
              await closeModbusClient(connection)
            }
            done(err)
          }
        }, 300)
      })
    }).catch(done)
  })

  it('should accept write requests from a Modbus TCP client', function (done) {
    getPort().then((port) => {
      const flow = [{
        id: 'server',
        type: 'modbus-server',
        name: 'Test Server',
        hostname: '127.0.0.1',
        serverPort: port,
        responseDelay: 10,
        delayUnit: 'ms',
        coilsBufferSize: 1024,
        holdingBufferSize: 1024,
        inputBufferSize: 1024,
        discreteBufferSize: 1024,
        showStatusActivities: true,
        showErrors: true
      }]

      helper.load([serverNode], flow, function () {
        setTimeout(async function () {
          let connection

          try {
            connection = await connectModbusClient(port)
            await connection.client.writeSingleRegister(5, 1234)
            const resp = await connection.client.readHoldingRegisters(5, 1)
            assert.strictEqual(resp.response.body.valuesAsArray[0], 1234)
            await closeModbusClient(connection)
            done()
          } catch (err) {
            if (connection) {
              await closeModbusClient(connection)
            }
            done(err)
          }
        }, 300)
      })
    }).catch(done)
  })
})
