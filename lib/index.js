const { join, dirname } = require('path')
const { spawn } = require('child_process')
const fs = require('fs').promises
const EventEmitter = require('events')
const net = require('net')
const getPortPromise = import('get-port')
const { IPC } = require('./runtime/ipc.cjs')
const { pack, unpack } = require('msgpackr')
const _get = require('lodash.get')

const SINGLE_EXECUTE = true // for now, only run one script per guest process
const NODE_MODULES_PATH = join(__dirname, '..', 'node_modules')

exports.Sandbox = class Sandbox extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.opts = {
      runtime: typeof opts.runtime === 'string' ? opts.runtime : undefined,
      globals: opts.globals && typeof opts.globals === 'object' ? opts.globals : {},
      strace: !!opts.strace,
      logSpawn: !!opts.logSpawn,
      noSandbox: !!opts.noSandbox,
      pipeStdout: !!opts.pipeStdout,
      pipeStderr: !!opts.pipeStderr
    }
    if (!this.opts.runtime) {
      throw new Error('Must specify a runtime module')
    }
    this.guestProcess = undefined
    this.ipcServer = undefined
    this.ipcServerPort = undefined
    this.ipcClientPort = undefined
    this.ipc = undefined
    this.whenGuestProcessClosed = new Promise(_r => {
      this._onClose = _r
    })
    this.globalsMap = toGlobalsMap(this.opts.globals)
    process.on('exit', () => {
      this.ipcServer?.close()
      this.guestProcess?.kill()
    })
  }

  get guestExitCode () {
    return this.guestProcess?.exitCode
  }

  get guestExitSignal () {
    return this.guestProcess?.signalCode
  }

  get isGuestProcessActive () {
    return this.guestExitCode === null && this.guestExitSignal === null
  }

  get runtimePath () {
    return join(__dirname, 'runtime', 'exec.cjs')
  }

  async init () {
    const getPort = await getPortPromise
    this.ipcServerPort = await getPort.default(getPort.portNumbers(3000, 65e3))
    this.ipcClientPort = await getPort.default(getPort.portNumbers(3000, 65e3))
    this.ipcServer = net.createServer()
    this.ipcServer.listen(this.ipcServerPort)

    const connPromise = new Promise(resolve => {
      this.ipcServer.on('connection', resolve)
    })

    if (this.opts.noSandbox) {
      this.guestProcess = doSpawn(this.opts, process.execPath, [this.runtimePath, this.opts.runtime, this.ipcServerPort, this.ipcClientPort, '--no-sandbox'])
    } else {
      switch (process.platform) {
        case 'darwin':
          this.guestProcess = macosSpawn(this)
          break
        case 'linux':
          this.guestProcess = doSpawn(this.opts, process.execPath, [this.runtimePath, this.opts.runtime, this.ipcServerPort, this.ipcClientPort])
          break
        default:
          throw new Error(`The ${process.platform} platform is not yet supported`)
      }
    }

    if (this.opts.pipeStdout) {
      this.guestProcess.stdout.on('data', chunk => {
        console.log('[SANDBOX]', chunk.toString('utf8'))
      })
    }
    if (this.opts.pipeStderr) {
      this.guestProcess.stderr.on('data', chunk => {
        console.log('[SANDBOX]', chunk.toString('utf8'))
      })
    }
    this.guestProcess.on('exit', code => {
      this._onClose(code)
    })

    const conn = await connPromise
    conn.on('error', ()=>{}) // ignore
    this.ipc = new IPC(conn, conn, this._handleIpcRequest.bind(this))
  }

  async teardown () {
    if (this.isGuestProcessActive) {
      this.guestProcess.kill()
    }
    return await this.whenGuestProcessClosed
  }

  async listContainers (params) {
    return await this._request(0, `__list_containers`, params)
  }

  async execContainer (opts) {
    if (!opts.source && typeof opts?.sourcePath !== 'string') {
      throw new Error(`source or sourcePath must be provided`)
    }
    opts.source = opts.source || await fs.readFile(opts.sourcePath)
    opts.globalsMap = Object.keys(this.globalsMap)
    return this._request(0, `__exec_container`, opts)
  }

  async killContainer (params) {
    return await this._request(0, `__kill_container`, params)
  }

  handleAPICall (cid, methodName, params) {
    return this._request(cid, methodName, params)
  }

  async _handleIpcRequest (cid, body) {
    if (cid !== 0) {
      throw new Error(`Unable to handle request: host CID ${cid} invalid`)
    }
    const {method, params} = unpack(body)
    switch (method) {
      case '__notify_container_closed': {
        this.emit('container-closed', params)
        if (params.error) {
          this.emit('container-runtime-error', params)
        }
        if (SINGLE_EXECUTE) {
          this.teardown()
        }
        break
      }
      default: {
        const fn = _get(this.globalsMap, method)
        if (typeof fn === 'function') {
          return await fn(...(params || []))
        } else {
          throw new Error(`Function ${method} does not exist`)
        }
      }
    }
  }

  async _request (cid, method, params) {
    try {
      const res = await this.ipc.request(cid, pack({method, params}))
      return unpack(res)
    } catch (errPacked) {
      const errBody = unpack(errPacked)
      const err = new Error(errBody.message)
      throw err
    }
  }
}

function macosSpawn (sbx) {
  const runtimePathSegments = sbx.runtimePath.split('/').filter(Boolean)
  const runtimePathVariations = []
  const acc = []
  for (const segment of runtimePathSegments) {
    acc.push(segment)
    runtimePathVariations.push(`/${acc.join('/')}`)
  }

  const profile = `(version 1)
(debug allow)
(deny default)

; v8 needs to read the kernel version
(allow sysctl-read)

; nodejs needs to run cwd()
(allow file-read* (literal "${process.cwd()}"))

; nodejs needs to read the runtime scripts folder as well as the node_modules dir
; this appears to require running lstat up the path chain (presumably to check for symlinks?)
(allow file-read* (subpath "${dirname(sbx.runtimePath)}"))
(allow file-read* (subpath "${NODE_MODULES_PATH}"))
${runtimePathVariations.map(str => `(allow file-read-metadata (literal "${str}"))`).join('\n')}

; the runtime needs to be able to connect to the ipc socket
(allow network* (local ip "*:${sbx.ipcServerPort}"))
(allow network* (local ip "*:${sbx.ipcClientPort}"))

; allow nodejs to run
(allow process-exec (literal "${process.execPath}"))`

  const childProcess = doSpawn(sbx.opts, 
    'sandbox-exec',
    [
      '-p', profile,
      process.execPath, sbx.runtimePath, sbx.opts.runtime, sbx.ipcServerPort, sbx.ipcClientPort
    ]
  )
  return childProcess
}

function doSpawn (extraOpts, cmd, args) {
  if (extraOpts.strace) {
    args.unshift(cmd)
    args.unshift('-c')
    cmd = 'strace'
  }
  if (extraOpts.logSpawn) {
    console.log('SPAWN', cmd, args)
  }
  return spawn(cmd, args)
}

function toGlobalsMap (obj, path = []) {
  if (typeof obj !== 'object') {
    return {[path.join('.')]: obj}
  } else {
    return Object.entries(obj)
      .map(([key, value]) => toGlobalsMap(value, [...path, key]))
      .reduce((acc, v) => Object.assign(acc, v), {})
  }
}
