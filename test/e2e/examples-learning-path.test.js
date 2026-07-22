/**
 * Validates example flows for the Modbus Server learning path.
 * Loads server-only examples in Node-RED and checks for stable deploy.
 */

'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const helper = require('node-red-node-test-helper')

const injectNode = require('@node-red/nodes/core/common/20-inject.js')
const debugNode = require('@node-red/nodes/core/common/21-debug.js')
const functionNode = require('@node-red/nodes/core/function/10-function.js')
const commentNode = require('@node-red/nodes/core/common/90-comment.js')

const serverNode = require('../../src/modbus-server')
const demoServerNode = require('../../src/modbus-server-demo')
const tlsServerNode = require('../../src/modbus-server-tls')

helper.init(require.resolve('node-red'))

const EXAMPLES_ROOT = path.join(__dirname, '../../examples')
const CORE_NODES = [injectNode, debugNode, functionNode, commentNode]

const SERVER_ONLY_EXAMPLES = [
  {
    id: '01-hello-modbus-server',
    portProperty: 'serverPort',
    expectedServerType: 'modbus-server',
    nodes: [...CORE_NODES, serverNode]
  },
  {
    id: '02-write-server-memory',
    portProperty: 'serverPort',
    expectedServerType: 'modbus-server',
    nodes: [...CORE_NODES, serverNode]
  },
  {
    id: '03-observe-server-buffers',
    portProperty: 'serverPort',
    expectedServerType: 'modbus-server',
    nodes: [...CORE_NODES, serverNode]
  },
  {
    id: '04-demo-server-patterns',
    portProperty: 'serverPort',
    expectedServerType: 'modbus-server-demo',
    nodes: [...CORE_NODES, demoServerNode]
  },
  {
    id: '05-tls-secure-server',
    portProperty: 'serverPort',
    expectedServerType: 'modbus-server-tls',
    nodes: [...CORE_NODES, tlsServerNode]
  }
]

const CLIENT_EXAMPLE = '06-test-with-modbus-client'

const ALLOWED_CORE_TYPES = new Set([
  'tab',
  'comment',
  'inject',
  'debug',
  'function',
  'modbus-server',
  'modbus-server-demo',
  'modbus-server-tls'
])

const ALLOWED_CLIENT_TYPES = new Set([
  ...ALLOWED_CORE_TYPES,
  'modbus-client',
  'modbus-read',
  'modbus-write',
  'modbus-getter',
  'modbus-flex-getter',
  'modbus-flex-write'
])

function exampleFileName (exampleId) {
  return `${exampleId}.json`
}

function loadFlowJson (exampleId) {
  const flowPath = path.join(EXAMPLES_ROOT, exampleFileName(exampleId))
  assert.ok(fs.existsSync(flowPath), `missing ${exampleFileName(exampleId)}`)
  const raw = fs.readFileSync(flowPath, 'utf8')
  const flow = JSON.parse(raw)
  assert.ok(Array.isArray(flow), `${exampleId} flow must be an array`)
  assert.ok(flow.length > 0, `${exampleId} flow must not be empty`)
  return flow
}

function assignEphemeralPort (flow, portProperty) {
  return flow.map((node) => {
    if (node && Object.prototype.hasOwnProperty.call(node, portProperty)) {
      return { ...node, [portProperty]: 0, hostname: '127.0.0.1' }
    }
    return node
  })
}

describe('Example flows learning path', function () {
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

  it('should expose numbered example JSON files at examples root', function () {
    const files = fs.readdirSync(EXAMPLES_ROOT)
      .filter((name) => /^\d{2}-.+\.json$/.test(name))
      .sort()

    assert.deepStrictEqual(files, [
      '01-hello-modbus-server.json',
      '02-write-server-memory.json',
      '03-observe-server-buffers.json',
      '04-demo-server-patterns.json',
      '05-tls-secure-server.json',
      '06-test-with-modbus-client.json'
    ])
  })

  SERVER_ONLY_EXAMPLES.forEach((example) => {
    it(`should validate and load ${example.id} without errors`, function (done) {
      const flow = loadFlowJson(example.id)

      for (const node of flow) {
        assert.ok(node.type, `${example.id} node missing type`)
        assert.ok(
          ALLOWED_CORE_TYPES.has(node.type),
          `${example.id} contains unexpected node type: ${node.type}`
        )
      }

      const serverNodes = flow.filter((n) => n.type === example.expectedServerType)
      assert.ok(serverNodes.length >= 1, `${example.id} must include ${example.expectedServerType}`)

      const loadFlow = assignEphemeralPort(flow, example.portProperty)
        .filter((node) => node.type !== 'tab')

      helper.load(example.nodes, loadFlow, function () {
        try {
          for (const server of serverNodes) {
            const loaded = helper.getNode(server.id)
            assert.ok(loaded, `failed to load node ${server.id}`)
          }
          done()
        } catch (err) {
          done(err)
        }
      })
    })
  })

  it('should validate 06 client example structure and document client dependency', function () {
    const flow = loadFlowJson(CLIENT_EXAMPLE)
    const docsReadme = fs.readFileSync(path.join(__dirname, '../../docs/README.md'), 'utf8')

    assert.ok(
      docsReadme.includes('@plus4nodered/node-red-contrib-modbus'),
      'docs README must mention client package'
    )
    assert.ok(docsReadme.includes('^6') || docsReadme.includes('v6'), 'docs README must require v6+')
    assert.ok(
      !fs.existsSync(path.join(EXAMPLES_ROOT, 'README.md')),
      'examples/ must not contain README.md (Node-RED only supports flow JSON there)'
    )

    for (const node of flow) {
      assert.ok(
        ALLOWED_CLIENT_TYPES.has(node.type),
        `06 contains unexpected node type: ${node.type}`
      )
    }

    assert.ok(flow.some((n) => n.type === 'modbus-server'), '06 must include modbus-server')
    assert.ok(flow.some((n) => n.type === 'modbus-client'), '06 must include modbus-client')
    assert.ok(flow.some((n) => n.type === 'inject'), '06 must use Inject for timing')
  })

  it('should keep example buffers modest to avoid memory pressure', function () {
    for (const example of SERVER_ONLY_EXAMPLES) {
      const flow = loadFlowJson(example.id)
      for (const node of flow) {
        for (const key of ['coilsBufferSize', 'holdingBufferSize', 'inputBufferSize', 'discreteBufferSize']) {
          if (node[key] !== undefined) {
            const size = parseInt(node[key], 10)
            assert.ok(size <= 1024, `${example.id} ${key}=${size} exceeds learning-path limit`)
          }
        }
      }
    }
  })
})
