const fs = require('fs')
const seccomp = process.platform === 'linux' ? require('node-seccomp') : undefined
const { ALLOWED_SYSCALLS } = process.platform === 'linux' ? require('./seccomp.cjs') : {}

const noSandbox = process.argv.includes('--no-sandbox')
const scriptPath = process.argv[2]
const scriptSource = fs.readFileSync(scriptPath, 'utf-8')

if (seccomp && !noSandbox) {
  
  const sc = seccomp.NodeSeccomp()
  sc.init(seccomp.SCMP_ACT_KILL_PROCESS)
  for (const syscall of ALLOWED_SYSCALLS) {
    sc.ruleAdd(seccomp.SCMP_ACT_ALLOW, syscall)
  }
  sc.load()
}

eval(scriptSource)