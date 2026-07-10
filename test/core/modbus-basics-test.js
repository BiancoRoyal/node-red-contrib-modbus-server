/**
 * Unit tests for modbus-basics module
 */

'use strict'

const assert = require('assert')
const sinon = require('sinon')
const mbBasics = require('../../src/modbus-basics')

describe('Modbus Basics', function () {
  describe('calc_rateByUnit', function () {
    it('should keep milliseconds unchanged', function () {
      assert.strictEqual(mbBasics.calc_rateByUnit(100, 'ms'), 100)
    })

    it('should convert seconds to milliseconds', function () {
      assert.strictEqual(mbBasics.calc_rateByUnit(2, 's'), 2000)
    })

    it('should convert minutes to milliseconds', function () {
      assert.strictEqual(mbBasics.calc_rateByUnit(1, 'm'), 60000)
    })

    it('should convert hours to milliseconds', function () {
      assert.strictEqual(mbBasics.calc_rateByUnit(1, 'h'), 3600000)
    })

    it('should use default multiplier for unknown units', function () {
      assert.strictEqual(mbBasics.calc_rateByUnit(3, 'unknown'), 30000)
    })
  })

  describe('setNodeStatusProperties', function () {
    it('should map known status values', function () {
      assert.deepStrictEqual(mbBasics.setNodeStatusProperties('initialized', true), {
        fill: 'yellow', shape: 'ring', status: 'initialized'
      })
      assert.deepStrictEqual(mbBasics.setNodeStatusProperties('connected', true), {
        fill: 'green', shape: 'ring', status: 'connected'
      })
      assert.deepStrictEqual(mbBasics.setNodeStatusProperties('active', true), {
        fill: 'green', shape: 'ring', status: 'active'
      })
      assert.deepStrictEqual(mbBasics.setNodeStatusProperties('error', true), {
        fill: 'red', shape: 'ring', status: 'error'
      })
      assert.deepStrictEqual(mbBasics.setNodeStatusProperties('closed', true), {
        fill: 'grey', shape: 'ring', status: 'closed'
      })
      assert.deepStrictEqual(mbBasics.setNodeStatusProperties('timeout', true), {
        fill: 'red', shape: 'ring', status: 'timeout'
      })
      assert.deepStrictEqual(mbBasics.setNodeStatusProperties('initialize', true), {
        fill: 'yellow', shape: 'ring', status: 'initialized'
      })
    })

    it('should map custom error-like status values to red', function () {
      const props = mbBasics.setNodeStatusProperties('connection error', true)
      assert.strictEqual(props.fill, 'red')
      assert.strictEqual(props.status, 'connection error')
    })

    it('should map unknown status values to blue', function () {
      const props = mbBasics.setNodeStatusProperties('listening', true)
      assert.strictEqual(props.fill, 'blue')
      assert.strictEqual(props.status, 'listening')
    })
  })

  describe('setNodeStatusTo', function () {
    it('should update node status when showStatusActivities is enabled', function () {
      const node = {
        showStatusActivities: true,
        statusText: '',
        status: sinon.spy()
      }

      mbBasics.setNodeStatusTo('active', node)
      assert.strictEqual(node.statusText, 'active')
      sinon.assert.calledOnce(node.status)
    })

    it('should set default status when status value is unchanged', function () {
      const node = {
        showStatusActivities: true,
        statusText: 'active',
        status: sinon.spy()
      }

      mbBasics.setNodeStatusTo('active', node)
      sinon.assert.calledWith(node.status, { fill: 'green', shape: 'ring', text: 'active' })
    })

    it('should not update status when showStatusActivities is disabled', function () {
      const node = {
        showStatusActivities: false,
        statusText: '',
        status: sinon.spy()
      }

      mbBasics.setNodeStatusTo('active', node)
      sinon.assert.notCalled(node.status)
    })
  })

  describe('setNodeDefaultStatus', function () {
    it('should set active ring status', function () {
      const node = { status: sinon.spy() }
      mbBasics.setNodeDefaultStatus(node)
      sinon.assert.calledWith(node.status, { fill: 'green', shape: 'ring', text: 'active' })
    })
  })

  describe('invalidPayloadIn', function () {
    it('should detect invalid payloads', function () {
      assert.strictEqual(mbBasics.invalidPayloadIn(null), true)
      assert.strictEqual(mbBasics.invalidPayloadIn({}), true)
      assert.strictEqual(mbBasics.invalidPayloadIn({ payload: '' }), true)
      assert.strictEqual(mbBasics.invalidPayloadIn({ payload: 'ok' }), false)
    })
  })

  describe('logMsgError', function () {
    it('should log errors with message context', function () {
      const node = { error: sinon.spy() }
      const err = new Error('boom')
      const msg = { payload: 1 }

      mbBasics.logMsgError(node, err, msg)
      sinon.assert.calledOnce(node.error)
    })

    it('should log unknown errors without err object', function () {
      const node = { error: sinon.spy() }
      mbBasics.logMsgError(node, null, { payload: 1 })
      sinon.assert.calledWith(node.error, 'unknown error', { payload: 1 })
    })

    it('should ignore calls without node', function () {
      assert.doesNotThrow(() => mbBasics.logMsgError(null, new Error('x'), {}))
    })
  })
})
