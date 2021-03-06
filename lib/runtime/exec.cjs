const seccomp = process.platform === 'linux' ? require('node-seccomp') : undefined
const { ALLOWED_SYSCALLS } = process.platform === 'linux' ? require('./_seccomp.cjs') : {}
const { IPC } = require('./ipc.cjs')
const { pack, unpack } = require('msgpackr')
const { connect } = require('net')
const _set = require('lodash.set')

const noSandbox = process.argv.includes('--no-sandbox')
const runtimeModule = process.argv[2]
const ipcServerPort = process.argv[3]
const ipcClientPort = process.argv[4]
const Runtime = require(runtimeModule)
const conn = connect({port: Number(ipcServerPort), family: 4, localAddress: '127.0.0.1', localPort: Number(ipcClientPort), lookup: (hostname, opts, cb) => cb(null, '127.0.0.1', 4)})

class ContainerManager {
  constructor () {
    this._cidInc = 0
    this.containers = new Map()
  }

  list () {
    const containers = Object.values(this.containers)
    return {
      containers: containers.map(c => ({cid: c.id, opts: c.opts}))
    }
  }

  async exec (opts) {
    if (typeof opts?.source === 'undefined') {
      throw new Error(`source must be provided`)
    }
    opts.globals = {}
    if (Array.isArray(opts.globalsMap)) {
      opts.globalsMap.forEach(path => {
        _set(opts.globals, path, async (...params) => unpack(await ipc.request(0, pack({method: path, params}))))
      })
    }
    const container = {
      cid: ++this._cidInc,
      opts,
      runtime: new Runtime(opts)
    }
    this.containers.set(container.cid, container)
    container.runtime.on('closed', (exitCode) => this.onClose(container, exitCode))
    await container.runtime.init()
    await container.runtime.run().catch(e => this.onRunError(container, e))
    return {cid: container.cid}
  }

  config ({cid, opts}) {
    const container = this.containers.get(cid)
    if (!container) throw new Error(`Container not found: ${cid}`)
    container.runtime.configure(opts)
  }

  kill ({cid}) {
    const container = this.containers.get(cid)
    if (!container) throw new Error(`Container not found: ${cid}`)
    container.runtime.close()
  }

  killAll () {
    for (const container of Object.values(this.containers)) {
      container.runtime?.close?.()
    }
  }

  onClose (container, exitCode) {
    this.containers.delete(container.cid)
    ipc.notify(0, pack({method: '__notify_container_closed', params: {cid: container.cid, exitCode}}))
  }

  onRunError (container, error) {
    this.containers.delete(container.cid)
    ipc.notify(0, pack({method: '__notify_container_closed', params: {cid: container.cid, error: {name: error.name || 'Error', message: error.message || error.toString(), details: error.details}}}))
  }
}

const manager = new ContainerManager()

const ipc = new IPC(conn, conn, async (cid, body) => {
  if (cid === 0) {
    try {
      const {method, params} = unpack(body)
      switch (method) {
        case '__list_containers': {
          return pack(manager.list())
        }
        case '__exec_container': {
          return pack(await manager.exec(params))
        }
        case '__config_container': {
          return pack(await manager.config(params))
        }
        case '__kill_container': {
          return pack(manager.kill(params))
        }
        default:
          throw new Error(`Method not found: ${method}`)
      }
    } catch (e) {
      throw pack({name: e.constructor?.name || 'Error', message: e.message || e.name, details: e.details})
    }
  } else {
    const container = manager.containers.get(cid)
    if (!container) throw pack({message: `No container found with cid ${cid}`})
    try {
      const {method, params} = unpack(body)
      return pack(await container.runtime.handleAPICall(method, params))
    } catch (e) {
      throw pack({name: e.constructor?.name || 'Error', message: e.message || e.name, details: e.details})
    }
  }
})

if (seccomp && !noSandbox) {
  const sc = seccomp.NodeSeccomp()
  sc.init(seccomp.SCMP_ACT_KILL_PROCESS)
  for (const syscall of ALLOWED_SYSCALLS) {
    sc.ruleAdd(seccomp.SCMP_ACT_ALLOW, syscall)
  }
  sc.load()
}