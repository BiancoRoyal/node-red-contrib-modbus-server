/**
 * Unit tests for modbus-logger module
 */

'use strict'

const assert = require('assert')

describe('Modbus Logger', function () {
  const originalDebug = process.env.DEBUG
  const originalLogLevel = process.env.MODBUS_LOG_LEVEL

  afterEach(function () {
    process.env.DEBUG = originalDebug
    process.env.MODBUS_LOG_LEVEL = originalLogLevel
    delete require.cache[require.resolve('../../src/core/modbus-logger')]
  })

  function loadLogger () {
    return require('../../src/core/modbus-logger')
  }

  it('should return cached winston loggers for the same namespace', function () {
    const loggerModule = loadLogger()
    const first = loggerModule.getLogger('test:cache')
    const second = loggerModule.getLogger('test:cache')
    assert.strictEqual(first, second)
  })

  it('should default namespace when none is provided', function () {
    const loggerModule = loadLogger()
    const logger = loggerModule.getLogger()
    assert.strictEqual(logger.defaultMeta.label, 'modbus')
  })

  it('should enable debug logging for matching DEBUG namespaces', function () {
    process.env.DEBUG = 'contribModbusServer:*'
    const loggerModule = loadLogger()
    const debugFn = loggerModule.getDebugLogger('contribModbusServer:server')
    assert.strictEqual(debugFn.enabled, true)
    assert.doesNotThrow(() => debugFn('debug message', { topic: 'test' }))
  })

  it('should support wildcard DEBUG patterns', function () {
    process.env.DEBUG = 'contribModbusServer:core:*'
    const loggerModule = loadLogger()
    const debugFn = loggerModule.getDebugLogger('contribModbusServer:core:server')
    assert.strictEqual(debugFn.enabled, true)
  })

  it('should expose debug-compatible extend and enabled setter', function () {
    const loggerModule = loadLogger()
    const debugFn = loggerModule.getDebugLogger('contribModbusServer:test')
    const extended = debugFn.extend('child')
    assert.strictEqual(extended.namespace, 'contribModbusServer:test:child')

    debugFn.enabled = true
    assert.strictEqual(debugFn.enabled, true)
    debugFn.enabled = false
    assert.strictEqual(debugFn.enabled, false)
  })

  it('should stringify object arguments and handle circular references', function () {
    const loggerModule = loadLogger()
    const debugFn = loggerModule.getDebugLogger('contribModbusServer:objects')
    debugFn.enabled = true

    const circular = { name: 'modbus' }
    circular.self = circular
    assert.doesNotThrow(() => debugFn('payload', circular))
  })

  it('should support default export compatibility', function () {
    const loggerModule = loadLogger()
    const debugFn = loggerModule.default('contribModbusServer:default')
    assert.strictEqual(typeof debugFn, 'function')
    assert.strictEqual(typeof loggerModule.default.default, 'function')
  })
})
