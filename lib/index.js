import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import * as macos from './macos/index.js'

const __dirname = join(dirname(fileURLToPath(import.meta.url)))

export class Sandbox {
  constructor (scriptPath, opts = {}) {
    this.scriptPath = scriptPath
    this.opts = opts
    this.process = undefined
    this.exitCode = undefined
    this.whenFinished = new Promise(_r => {
      this._onClose = _r
    })
  }

  get runtimePath () {
    return join(__dirname, 'runtimes', 'eval.cjs')
  }

  exec () {
    if (this.opts.noSandbox) {
      this.process = spawn(process.execPath, [this.runtimePath, this.scriptPath])
    } else {
      switch (process.platform) {
        case 'darwin':
          this.process = macos.exec(this)
          break
        default:
          throw new Error(`The ${process.platform} platform is not yet supported`)
      }
    }
    if (this.opts.pipeStdout) {
      this.process.stdout.on('data', chunk => {
        console.log('[SANDBOX]', chunk.toString('utf8'))
      })
    }
    if (this.opts.pipeStderr) {
      this.process.stderr.on('data', chunk => {
        console.log('[SANDBOX]', chunk.toString('utf8'))
      })
    }
    this.process.on('exit', code => {
      this.exitCode = code
      this._onClose(code)
    })
  }
}