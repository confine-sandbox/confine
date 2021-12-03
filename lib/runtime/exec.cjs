const seccomp = process.platform === 'linux' ? require('node-seccomp') : undefined
const { ALLOWED_SYSCALLS } = process.platform === 'linux' ? require('./_seccomp.cjs') : {}

const noSandbox = process.argv.includes('--no-sandbox')
const runtimeModule = process.argv[2]
const scriptPath = process.argv[3]

const Runtime = require(runtimeModule)

;(async () => {
  const runtime = new Runtime(scriptPath)
  await runtime.init()

  if (seccomp && !noSandbox) {
    const sc = seccomp.NodeSeccomp()
    sc.init(seccomp.SCMP_ACT_KILL_PROCESS)
    for (const syscall of ALLOWED_SYSCALLS) {
      sc.ruleAdd(seccomp.SCMP_ACT_ALLOW, syscall)
    }
    sc.load()
  }

  await runtime.run()
})()