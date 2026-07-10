/**
 * Unit tests for modbus-server node lifecycle
 */

'use strict'

const assert = require('assert')
const sinon = require('sinon')
const helper = require('node-red-node-test-helper')
const serverNode = require('../../src/modbus-server')
const mbBasics = require('../../src/modbus-basics')

helper.init(require.resolve('node-red'))

describe('Modbus Server lifecycle', function () {
  this.timeout(5000)

  before(function (done) {
    helper.startServer(done)
  })

  afterEach(function (done) {
    helper.unload().then(() => done()).catch(done)
  })

  after(function (done) {
    helper.stopServer(done)
  })

  it('should close netServer and reset modbusServer on node close', function (done) {
    const flow = [{
      id: 'server',
      type: 'modbus-server',
      name: 'Lifecycle Server',
      hostname: '127.0.0.1',
      serverPort: 0,
      responseDelay: 1,
      delayUnit: 'ms',
      coilsBufferSize: 128,
      holdingBufferSize: 128,
      inputBufferSize: 128,
      discreteBufferSize: 128,
      showStatusActivities: false,
      showErrors: false
    }]

    helper.load([serverNode], flow, function () {
      const modbusServer = helper.getNode('server')
      const closeStub = sinon.stub(modbusServer.netServer, 'close').callsFake(function (callback) {
        callback()
      })

      modbusServer.on('close', function (closeDone) {
        closeStub.restore()
        assert.strictEqual(modbusServer.modbusServer, null)
        closeDone()
      })

      helper.unload().then(() => done()).catch(done)
    })
  })

  it('should finish close when netServer is unavailable', function (done) {
    const flow = [{
      id: 'server',
      type: 'modbus-server',
      name: 'Lifecycle Server',
      hostname: '127.0.0.1',
      serverPort: 0,
      responseDelay: 1,
      delayUnit: 'ms',
      coilsBufferSize: 128,
      holdingBufferSize: 128,
      inputBufferSize: 128,
      discreteBufferSize: 128,
      showStatusActivities: false,
      showErrors: false
    }]

    helper.load([serverNode], flow, function () {
      const modbusServer = helper.getNode('server')
      modbusServer.netServer = null

      modbusServer.on('close', function (closeDone) {
        assert.strictEqual(modbusServer.modbusServer, null)
        closeDone()
      })

      helper.unload().then(() => done()).catch(done)
    })
  })

  it('should set default status when showStatusActivities is disabled', function (done) {
    const flow = [{
      id: 'server',
      type: 'modbus-server',
      name: 'Default Status Server',
      hostname: '127.0.0.1',
      serverPort: 0,
      responseDelay: 1,
      delayUnit: 'ms',
      coilsBufferSize: 128,
      holdingBufferSize: 128,
      inputBufferSize: 128,
      discreteBufferSize: 128,
      showStatusActivities: false,
      showErrors: false
    }]

    const statusSpy = sinon.spy(mbBasics, 'setNodeDefaultStatus')

    helper.load([serverNode], flow, function () {
      sinon.assert.called(statusSpy)
      statusSpy.restore()
      done()
    })
  })
})
