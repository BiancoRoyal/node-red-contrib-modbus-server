/**
 Copyright (c) since the year 2016 Klaus Landsdorf (http://plus4nodered.com/)
 All rights reserved.
 node-red-contrib-modbus - The BSD 3-Clause License

 @author <a href="mailto:klaus.landsdorf@bianco-royal.de">Klaus Landsdorf</a> (Bianco Royal)
 **/

/**
 * Modbus TLS Server Demo node.
 * @module NodeRedModbusTLSServer
 *
 * @param RED
 */
module.exports = function (RED) {
  'use strict'
  // SOURCE-MAP-REQUIRED
  const modbus = require('jsmodbus')
  const tls = require('tls')
  const fs = require('fs')
  // const path = require('path')
  // const coreServer = require('./core/modbus-server-core')
  const mbBasics = require('./modbus-basics')
  const internalDebugLog = require('./core/modbus-logger').getDebugLogger('contribModbusServer:server:tls')

  function ModbusTLSServer (config) {
    RED.nodes.createNode(this, config)

    const bufferFactor = 8

    this.name = config.name
    this.logEnabled = config.logEnabled
    this.hostname = config.hostname || '0.0.0.0'
    this.serverPort = parseInt(config.serverPort) || 8502
    this.responseDelay = parseInt(config.responseDelay) || 1
    this.delayUnit = config.delayUnit
    this.showStatusActivities = config.showStatusActivities || false

    // Buffer sizes
    this.coilsBufferSize = parseInt(config.coilsBufferSize * bufferFactor) || 80000
    this.holdingBufferSize = parseInt(config.holdingBufferSize * bufferFactor) || 80000
    this.inputBufferSize = parseInt(config.inputBufferSize * bufferFactor) || 80000
    this.discreteBufferSize = parseInt(config.discreteBufferSize * bufferFactor) || 80000

    // TLS Configuration
    this.tlsOptions = {
      key: config.privateKey || '',
      cert: config.certificate || '',
      ca: config.ca || '',
      rejectUnauthorized: config.rejectUnauthorized !== false,
      requestCert: config.requestCert === true,
      secureProtocol: config.secureProtocol || 'TLSv1_2_method'
    }

    // Demo mode settings
    this.demoMode = config.demoMode !== false
    this.demoDataPattern = config.demoDataPattern || 'sequential'
    this.demoUpdateInterval = parseInt(config.demoUpdateInterval) || 1000
    this.demoAutoStart = config.demoAutoStart !== false
    this.demoRandomSeed = config.demoRandomSeed || null
    this.demoValueRange = {
      min: parseInt(config.demoValueMin) || 0,
      max: parseInt(config.demoValueMax) || 65535
    }
    this.demoRealisticMode = config.demoRealisticMode || false
    this.demoDeviceSimulation = config.demoDeviceSimulation || 'generic'
    this.demoErrorRate = parseFloat(config.demoErrorRate) || 0

    this.showErrors = config.showErrors
    this.internalDebugLog = internalDebugLog
    this.verboseLogging = RED.settings.verbose

    const node = this

    node.tlsServer = null
    node.modbusServer = null
    node.demoTimer = null
    node.demoCounter = 0

    mbBasics.setNodeStatusTo('initialized', node)

    // Initialize demo data
    node.demoData = {
      coils: Buffer.alloc(node.coilsBufferSize),
      discrete: Buffer.alloc(node.discreteBufferSize),
      holding: Buffer.alloc(node.holdingBufferSize),
      input: Buffer.alloc(node.inputBufferSize)
    }

    // Demo data generation functions (aligned with Modbus-Server-Demo)
    const generateDemoData = {
      sequential: function (counter, max, min) {
        const range = max - min
        return min + (counter % (range || 1))
      },
      random: function (counter, max, min) {
        if (node.demoRandomSeed !== null && node.demoRandomSeed !== '') {
          const seed = Number(node.demoRandomSeed) + counter
          const x = Math.sin(seed) * 10000
          return min + Math.floor((x - Math.floor(x)) * (max - min || 1))
        }
        return min + Math.floor(Math.random() * (max - min || 1))
      },
      sine: function (counter, max, min) {
        const range = max - min
        return min + Math.floor((Math.sin(counter * 0.1) + 1) * range / 2)
      },
      square: function (counter, max, min) {
        return (Math.floor(counter / 10) % 2) ? max : min
      },
      sawtooth: function (counter, max, min) {
        const period = 20
        const range = max - min
        return min + Math.floor((counter % period) * range / period)
      },
      mixed: function (counter, max, min, index) {
        const patterns = ['sequential', 'random', 'sine', 'square', 'sawtooth']
        const patternIndex = (index || 0) % patterns.length
        return generateDemoData[patterns[patternIndex]](counter, max, min)
      }
    }

    const deviceSimulations = {
      generic: function () {
        return generateDemoData[node.demoDataPattern](
          node.demoCounter,
          node.demoValueRange.max,
          node.demoValueRange.min
        )
      },
      temperature: function (index) {
        const base = 25
        const variation = 5 * Math.sin((node.demoCounter + index * 10) * 0.01)
        const noise = (Math.random() - 0.5) * 0.5
        return Math.floor((base + variation + noise) * 10)
      },
      pressure: function (index) {
        const base = 1000
        const variation = 50 * Math.sin((node.demoCounter + index * 15) * 0.005)
        const noise = (Math.random() - 0.5) * 2
        return Math.floor(base + variation + noise)
      },
      flowmeter: function (index) {
        const base = 500
        const variation = 300 * Math.sin((node.demoCounter + index * 20) * 0.02)
        const noise = (Math.random() - 0.5) * 50
        return Math.floor(Math.max(0, base + variation + noise))
      },
      motor: function (index) {
        const rpm = 1500 + 500 * Math.sin(node.demoCounter * 0.01)
        const current = 10 + 5 * Math.sin(node.demoCounter * 0.02)
        const temp = 40 + 20 * Math.sin(node.demoCounter * 0.005)
        switch (index % 3) {
          case 0: return Math.floor(rpm)
          case 1: return Math.floor(current * 10)
          case 2: return Math.floor(temp * 10)
          default: return Math.floor(rpm)
        }
      },
      plc: function (index) {
        if (index < 100) {
          return (node.demoCounter + index) % 2
        }
        return generateDemoData.sine(node.demoCounter + index, 4095, 0)
      }
    }

    // Update demo data periodically
    function updateDemoData () {
      if (!node.demoMode) return

      const generator = node.demoRealisticMode
        ? deviceSimulations[node.demoDeviceSimulation] || deviceSimulations.generic
        : generateDemoData[node.demoDataPattern] || generateDemoData.sequential

      node.demoCounter++

      if (node.demoErrorRate > 0 && Math.random() < node.demoErrorRate) {
        if (node.verboseLogging) {
          internalDebugLog('Simulating error condition')
        }
        return
      }

      for (let i = 0; i < node.coilsBufferSize; i++) {
        if (node.demoRealisticMode && node.demoDeviceSimulation === 'plc') {
          node.demoData.coils[i] = generator(i) > 0 ? 1 : 0
        } else if (node.demoDataPattern === 'mixed') {
          node.demoData.coils[i] = generateDemoData.mixed(node.demoCounter + i, 2, 0, i)
        } else if (node.demoRealisticMode) {
          node.demoData.coils[i] = generator(i) > 0 ? 1 : 0
        } else {
          node.demoData.coils[i] = generator(node.demoCounter + i, 2, 0)
        }
      }

      for (let i = 0; i < node.discreteBufferSize; i++) {
        if (node.demoRealisticMode && node.demoDeviceSimulation === 'plc') {
          node.demoData.discrete[i] = generator(i + 1000) > 0 ? 1 : 0
        } else if (node.demoDataPattern === 'mixed') {
          node.demoData.discrete[i] = generateDemoData.mixed(node.demoCounter + i * 2, 2, 0, i)
        } else if (node.demoRealisticMode) {
          node.demoData.discrete[i] = generator(i + 1000) > 0 ? 1 : 0
        } else {
          node.demoData.discrete[i] = generator(node.demoCounter + i * 2, 2, 0)
        }
      }

      for (let i = 0; i < node.holdingBufferSize / 2; i++) {
        let value
        if (node.demoRealisticMode) {
          value = generator(i)
        } else if (node.demoDataPattern === 'mixed') {
          value = generateDemoData.mixed(
            node.demoCounter + i * 3,
            node.demoValueRange.max,
            node.demoValueRange.min,
            i
          )
        } else {
          value = generator(
            node.demoCounter + i * 3,
            node.demoValueRange.max,
            node.demoValueRange.min
          )
        }
        node.demoData.holding.writeUInt16BE(Math.max(0, Math.min(65535, value)), i * 2)
      }

      for (let i = 0; i < node.inputBufferSize / 2; i++) {
        let value
        if (node.demoRealisticMode) {
          value = generator(i + 2000)
        } else if (node.demoDataPattern === 'mixed') {
          value = generateDemoData.mixed(
            node.demoCounter + i * 4,
            node.demoValueRange.max,
            node.demoValueRange.min,
            i
          )
        } else {
          value = generator(
            node.demoCounter + i * 4,
            node.demoValueRange.max,
            node.demoValueRange.min
          )
        }
        node.demoData.input.writeUInt16BE(Math.max(0, Math.min(65535, value)), i * 2)
      }

      if (node.verboseLogging) {
        internalDebugLog('Demo data updated with pattern:', node.demoDataPattern)
      }
    }

    function loadTLSOptions () {
      const options = {}

      // Load private key
      if (node.tlsOptions.key) {
        try {
          if (node.tlsOptions.key.startsWith('-----BEGIN')) {
            options.key = node.tlsOptions.key
          } else if (fs.existsSync(node.tlsOptions.key)) {
            options.key = fs.readFileSync(node.tlsOptions.key)
          }
        } catch (err) {
          node.error('Failed to load TLS private key: ' + err.message)
        }
      }

      // Load certificate
      if (node.tlsOptions.cert) {
        try {
          if (node.tlsOptions.cert.startsWith('-----BEGIN')) {
            options.cert = node.tlsOptions.cert
          } else if (fs.existsSync(node.tlsOptions.cert)) {
            options.cert = fs.readFileSync(node.tlsOptions.cert)
          }
        } catch (err) {
          node.error('Failed to load TLS certificate: ' + err.message)
        }
      }

      // Load CA certificate
      if (node.tlsOptions.ca) {
        try {
          if (node.tlsOptions.ca.startsWith('-----BEGIN')) {
            options.ca = node.tlsOptions.ca
          } else if (fs.existsSync(node.tlsOptions.ca)) {
            options.ca = fs.readFileSync(node.tlsOptions.ca)
          }
        } catch (err) {
          node.error('Failed to load CA certificate: ' + err.message)
        }
      }

      options.rejectUnauthorized = node.tlsOptions.rejectUnauthorized
      options.requestCert = node.tlsOptions.requestCert
      options.secureProtocol = node.tlsOptions.secureProtocol

      return options
    }

    function startServer () {
      try {
        const tlsOptions = loadTLSOptions()

        // For demo mode, generate self-signed certificate if not provided
        if (node.demoMode && (!tlsOptions.key || !tlsOptions.cert)) {
          const forge = require('node-forge')
          const pki = forge.pki

          // Generate key pair
          const keys = pki.rsa.generateKeyPair(2048)
          const cert = pki.createCertificate()

          cert.publicKey = keys.publicKey
          cert.serialNumber = '01'
          cert.validity.notBefore = new Date()
          cert.validity.notAfter = new Date()
          cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1)

          const attrs = [{
            name: 'commonName',
            value: 'localhost'
          }, {
            name: 'countryName',
            value: 'US'
          }, {
            shortName: 'ST',
            value: 'Test'
          }, {
            name: 'localityName',
            value: 'Test'
          }, {
            name: 'organizationName',
            value: 'Node-RED Modbus Demo'
          }, {
            shortName: 'OU',
            value: 'Demo'
          }]

          cert.setSubject(attrs)
          cert.setIssuer(attrs)
          cert.setExtensions([{
            name: 'basicConstraints',
            cA: true
          }, {
            name: 'keyUsage',
            keyCertSign: true,
            digitalSignature: true,
            nonRepudiation: true,
            keyEncipherment: true,
            dataEncipherment: true
          }, {
            name: 'subjectAltName',
            altNames: [{
              type: 2, // DNS
              value: 'localhost'
            }, {
              type: 7, // IP
              ip: '127.0.0.1'
            }]
          }])

          cert.sign(keys.privateKey)

          tlsOptions.key = pki.privateKeyToPem(keys.privateKey)
          tlsOptions.cert = pki.certificateToPem(cert)

          node.warn('Demo mode: Using self-signed certificate for TLS')
        }

        // Create TLS server
        node.tlsServer = tls.createServer(tlsOptions, function (socket) {
          internalDebugLog('TLS Client connected')

          // Create Modbus server for this socket
          const modbusServer = new modbus.server.TCP(socket, {
            holding: node.demoData.holding,
            coils: node.demoData.coils,
            discrete: node.demoData.discrete,
            input: node.demoData.input
          })

          modbusServer.on('connection', function (client) {
            internalDebugLog('Modbus client connected via TLS')
            mbBasics.setNodeStatusTo('connected', node)
          })

          socket.on('end', function () {
            internalDebugLog('TLS Client disconnected')
            mbBasics.setNodeStatusTo('listening', node)
          })

          socket.on('error', function (err) {
            if (node.showErrors) {
              node.error('TLS Socket error: ' + err.message, { error: err })
            }
            internalDebugLog('TLS Socket error:', err)
          })
        })

        node.tlsServer.on('error', function (err) {
          if (node.showErrors) {
            node.error('TLS Server error: ' + err.message, { error: err })
          }
          internalDebugLog('TLS Server error:', err)
          mbBasics.setNodeStatusTo('error', node)
        })

        node.tlsServer.on('listening', function () {
          const address = node.tlsServer.address()
          internalDebugLog('TLS Modbus Server listening on ' + address.address + ':' + address.port)
          mbBasics.setNodeStatusTo('listening', node)

          // Start demo data updates
          if (node.demoMode && node.demoAutoStart) {
            updateDemoData()
            node.demoTimer = setInterval(updateDemoData, node.demoUpdateInterval)
            node.status({
              fill: 'green',
              shape: 'dot',
              text: 'TLS Demo Server listening on port ' + node.serverPort
            })
          }
        })

        node.tlsServer.listen(node.serverPort, node.hostname)

        internalDebugLog('Starting TLS Modbus server on ' + node.hostname + ':' + node.serverPort)
      } catch (err) {
        node.error('Failed to start TLS server: ' + err.message, { error: err })
        mbBasics.setNodeStatusTo('error', node)
      }
    }

    node.on('input', function (msg) {
      if (typeof msg.payload === 'string') {
        switch (msg.payload.toLowerCase()) {
          case 'restart':
            node.warn('Restarting TLS Modbus Server')
            stopServer(function () {
              startServer()
            })
            break
          case 'stop':
            stopServer()
            break
          case 'start':
            startServer()
            break
          case 'startdemo':
            if (node.demoMode) {
              updateDemoData()
              if (node.demoTimer) clearInterval(node.demoTimer)
              node.demoTimer = setInterval(updateDemoData, node.demoUpdateInterval)
            }
            break
          case 'stopdemo':
            if (node.demoTimer) {
              clearInterval(node.demoTimer)
              node.demoTimer = null
            }
            break
          case 'reset':
            node.demoCounter = 0
            updateDemoData()
            break
        }
      } else if (msg.payload && typeof msg.payload === 'object') {
        if (msg.payload.pattern) {
          node.demoDataPattern = msg.payload.pattern
        }
        if (msg.payload.interval) {
          node.demoUpdateInterval = parseInt(msg.payload.interval)
          if (node.demoTimer) {
            clearInterval(node.demoTimer)
            node.demoTimer = setInterval(updateDemoData, node.demoUpdateInterval)
          }
        }
        if (msg.payload.min !== undefined) {
          node.demoValueRange.min = parseInt(msg.payload.min)
        }
        if (msg.payload.max !== undefined) {
          node.demoValueRange.max = parseInt(msg.payload.max)
        }
        if (msg.payload.device) {
          node.demoDeviceSimulation = msg.payload.device
          node.demoRealisticMode = true
        }
        if (msg.payload.errorRate !== undefined) {
          node.demoErrorRate = parseFloat(msg.payload.errorRate)
        }
        updateDemoData()
      }
    })

    function stopServer (callback) {
      if (node.demoTimer) {
        clearInterval(node.demoTimer)
        node.demoTimer = null
      }

      if (node.tlsServer) {
        node.tlsServer.close(function () {
          internalDebugLog('TLS Server stopped')
          mbBasics.setNodeStatusTo('stopped', node)
          if (callback) callback()
        })
      } else {
        if (callback) callback()
      }
    }

    node.on('close', function (done) {
      stopServer(done)
    })

    // Start server on deploy
    startServer()
  }

  RED.nodes.registerType('modbus-server-tls', ModbusTLSServer)
}
