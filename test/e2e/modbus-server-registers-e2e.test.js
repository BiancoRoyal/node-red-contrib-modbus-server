/**
 * E2E register read/write tests for modbus-server node
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

function createServerFlow (port) {
  return [{
    id: 'server',
    type: 'modbus-server',
    name: 'Register Test Server',
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
}

function writeServerMemory (node, register, address, value) {
  node.receive({
    payload: {
      register,
      address,
      value,
      disableMsgOutput: 1
    }
  })
}

describe('Modbus Server register E2E Tests', function () {
  this.timeout(15000)

  before(function (done) {
    helper.startServer(done)
  })

  afterEach(function (done) {
    helper.unload().then(() => done()).catch(done)
  })

  after(function (done) {
    helper.stopServer(done)
  })

  it('should read holding registers with values written via Node-RED input', function (done) {
    getPort().then(async (port) => {
      helper.load([serverNode], createServerFlow(port), async function () {
        const modbusServer = helper.getNode('server')
        const registerValues = [
          { address: 0, value: 42 },
          { address: 5, value: 0x1234 },
          { address: 10, value: 65535 }
        ]

        registerValues.forEach(({ address, value }) => {
          writeServerMemory(modbusServer, 'holding', address, value)
        })

        let connection
        try {
          await new Promise(resolve => setTimeout(resolve, 300))
          connection = await connectModbusClient(port)

          for (const { address, value } of registerValues) {
            const resp = await connection.client.readHoldingRegisters(address, 1)
            assert.strictEqual(
              resp.response.body.valuesAsArray[0],
              value,
              `holding register ${address} should return ${value}`
            )
          }

          const block = await connection.client.readHoldingRegisters(0, 11)
          assert.strictEqual(block.response.body.valuesAsArray[0], 42)
          assert.strictEqual(block.response.body.valuesAsArray[5], 0x1234)
          assert.strictEqual(block.response.body.valuesAsArray[10], 65535)

          await closeModbusClient(connection)
          done()
        } catch (err) {
          if (connection) await closeModbusClient(connection)
          done(err)
        }
      })
    }).catch(done)
  })

  it('should read input registers with values written via Node-RED input', function (done) {
    getPort().then(async (port) => {
      helper.load([serverNode], createServerFlow(port), async function () {
        const modbusServer = helper.getNode('server')
        writeServerMemory(modbusServer, 'input', 0, 100)
        writeServerMemory(modbusServer, 'input', 3, 200)
        writeServerMemory(modbusServer, 'input', 7, 300)

        let connection
        try {
          await new Promise(resolve => setTimeout(resolve, 300))
          connection = await connectModbusClient(port)

          const r0 = await connection.client.readInputRegisters(0, 1)
          const r3 = await connection.client.readInputRegisters(3, 1)
          const r7 = await connection.client.readInputRegisters(7, 1)

          assert.strictEqual(r0.response.body.valuesAsArray[0], 100)
          assert.strictEqual(r3.response.body.valuesAsArray[0], 200)
          assert.strictEqual(r7.response.body.valuesAsArray[0], 300)

          await closeModbusClient(connection)
          done()
        } catch (err) {
          if (connection) await closeModbusClient(connection)
          done(err)
        }
      })
    }).catch(done)
  })

  it('should read coil and discrete values written via Node-RED input', function (done) {
    getPort().then(async (port) => {
      helper.load([serverNode], createServerFlow(port), async function () {
        const modbusServer = helper.getNode('server')
        writeServerMemory(modbusServer, 'coils', 0, 1)
        writeServerMemory(modbusServer, 'discrete', 0, 1)

        let connection
        try {
          await new Promise(resolve => setTimeout(resolve, 300))
          connection = await connectModbusClient(port)

          const coils = await connection.client.readCoils(0, 1)
          const discrete = await connection.client.readDiscreteInputs(0, 1)

          assert.strictEqual(coils.response.body.valuesAsArray[0], 1)
          assert.strictEqual(discrete.response.body.valuesAsArray[0], 1)

          await closeModbusClient(connection)
          done()
        } catch (err) {
          if (connection) await closeModbusClient(connection)
          done(err)
        }
      })
    }).catch(done)
  })

  it('should persist client writes and return correct values on read', function (done) {
    getPort().then(async (port) => {
      helper.load([serverNode], createServerFlow(port), async function () {
        let connection
        try {
          await new Promise(resolve => setTimeout(resolve, 300))
          connection = await connectModbusClient(port)

          await connection.client.writeSingleRegister(2, 4711)
          await connection.client.writeSingleRegister(8, 9000)
          await connection.client.writeSingleCoil(0, true)

          const holding2 = await connection.client.readHoldingRegisters(2, 1)
          const holding8 = await connection.client.readHoldingRegisters(8, 1)
          const coil0 = await connection.client.readCoils(0, 1)

          assert.strictEqual(holding2.response.body.valuesAsArray[0], 4711)
          assert.strictEqual(holding8.response.body.valuesAsArray[0], 9000)
          assert.strictEqual(coil0.response.body.valuesAsArray[0], 1)

          await closeModbusClient(connection)
          done()
        } catch (err) {
          if (connection) await closeModbusClient(connection)
          done(err)
        }
      })
    }).catch(done)
  })
})
