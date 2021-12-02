import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const __dirname = join(dirname(fileURLToPath(import.meta.url)))
export const RUNTIMES = {
  eval: join(__dirname, 'runtimes', 'eval.cjs')
}
RUNTIMES['default'] = RUNTIMES.eval

export class Sandbox {
  constructor (scriptPath, opts = {}) {
    this.scriptPath = scriptPath
    this.opts = {
      runtime: typeof opts.runtime === 'string' ? (RUNTIMES[opts.runtime] || opts.runtime) : RUNTIMES.default,
      strace: !!opts.strace,
      logSpawn: !!opts.logSpawn,
      noSandbox: !!opts.noSandbox,
      pipeStdout: !!opts.pipeStdout,
      pipeStderr: !!opts.pipeStderr
    }
    this.process = undefined
    this.exitCode = undefined
    this.whenFinished = new Promise(_r => {
      this._onClose = _r
    })
  }

  get runtimePath () {
    return this.opts.runtime
  }

  exec () {
    if (this.opts.noSandbox) {
      this.process = doSpawn(this.opts, process.execPath, [this.runtimePath, this.scriptPath, '--no-sandbox'])
    } else {
      switch (process.platform) {
        case 'darwin':
          this.process = macosSpawn(this)
          break
        case 'linux':
          this.process = doSpawn(this.opts, process.execPath, [this.runtimePath, this.scriptPath])
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

; nodejs needs to read the runtime script
; this appears to require running lstat up the path chain (presumably to check for symlinks?)
(allow file-read* (literal "${sbx.runtimePath}"))
${runtimePathVariations.map(str => `(allow file-read-metadata (literal "${str}"))`).join('\n')}

; the runtime needs to be able to read the executed script
(allow file-read* (literal "${sbx.scriptPath}"))

; allow nodejs to run
(allow process-exec (literal "${process.execPath}"))`

  const childProcess = doSpawn(sbx.opts, 
    'sandbox-exec',
    [
      '-p', profile,
      process.execPath, sbx.runtimePath, sbx.scriptPath
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
