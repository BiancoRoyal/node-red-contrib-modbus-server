/**
 * Copyright (c) since the year 2016 Klaus Landsdorf (http://plus4nodered.com/)
 * All rights reserved.
 * node-red-contrib-modbus-server
 *
 * Minimal modbus-basics module for server nodes
 * @author <a href="mailto:klaus.landsdorf@bianco-royal.de">Klaus Landsdorf</a> (Bianco Royal)
 */
'use strict'

// eslint-disable-next-line no-var
var de = de || { biancoroyal: { modbus: { basics: {} } } } // eslint-disable-line no-use-before-define

/**
 * Calculate rate based on unit
 */
de.biancoroyal.modbus.basics.calc_rateByUnit = function (rate, rateUnit) {
  switch (rateUnit) {
    case 'ms':
      break
    case 's':
      rate = parseInt(rate) * 1000 // seconds
      break
    case 'm':
      rate = parseInt(rate) * 60000 // minutes
      break
    case 'h':
      rate = parseInt(rate) * 3600000 // hours
      break
    default:
      rate = parseInt(rate) * 10000 // 10 sec
      break
  }
  return rate
}

/**
 * Set node status properties based on status value
 */
de.biancoroyal.modbus.basics.setNodeStatusProperties = function (statusValue, showStatusActivities) {
  const statusProperties = {
    fill: 'red',
    shape: 'ring',
    status: 'unknown'
  }

  switch (statusValue) {
    case 'initialized':
    case 'initialize':
      statusProperties.fill = 'yellow'
      statusProperties.status = 'initialized'
      break
    case 'connected':
      statusProperties.fill = 'green'
      statusProperties.status = 'connected'
      break
    case 'active':
      statusProperties.fill = 'green'
      statusProperties.status = 'active'
      break
    case 'error':
      statusProperties.fill = 'red'
      statusProperties.status = 'error'
      break
    case 'closed':
      statusProperties.fill = 'grey'
      statusProperties.status = 'closed'
      break
    case 'timeout':
      statusProperties.fill = 'red'
      statusProperties.status = 'timeout'
      break
    default:
      if (statusValue.indexOf('error') >= 0) {
        statusProperties.fill = 'red'
        statusProperties.status = statusValue
      } else {
        statusProperties.fill = 'blue'
        statusProperties.status = statusValue
      }
  }

  return statusProperties
}

/**
 * Set Node-RED visual status for a Modbus node
 */
de.biancoroyal.modbus.basics.setNodeStatusTo = function (statusValue, node) {
  if (node.showStatusActivities) {
    if (statusValue !== node.statusText) {
      const statusOptions = this.setNodeStatusProperties(statusValue, node.showStatusActivities)
      node.statusText = statusValue
      node.status({
        fill: statusOptions.fill,
        shape: statusOptions.shape,
        text: statusOptions.status
      })
    } else {
      this.setNodeDefaultStatus(node)
    }
  }
}

/**
 * Set default node status
 */
de.biancoroyal.modbus.basics.setNodeDefaultStatus = function (node) {
  node.status({ fill: 'green', shape: 'ring', text: 'active' })
}

/**
 * Invalid payload check
 */
de.biancoroyal.modbus.basics.invalidPayloadIn = function (msg) {
  return !(msg && msg.payload && Object.prototype.hasOwnProperty.call(msg, 'payload') && msg.payload !== '')
}

/**
 * Log message error
 */
de.biancoroyal.modbus.basics.logMsgError = function (node, err, msg) {
  if (node) {
    if (err) {
      const origError = err + ' ' + (err.message || '')
      const message = msg ? `${origError} msg: ${JSON.stringify(msg)}` : origError
      node.error(err, { error: origError, message, msg })
    } else {
      node.error('unknown error', msg)
    }
  }
}

module.exports = de.biancoroyal.modbus.basics
