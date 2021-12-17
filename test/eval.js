const ava = require('ava')
const net = require('net')
const { genIsBlocked } = require('./_util/index.js')

// create a socket for attempted connections
const sock = net.createServer(conn => conn.end())
sock.listen(5000)
sock.unref()

const isBlocked = genIsBlocked({
  runtime: 'jseval-confine-runtime',
  globals: {
    console: {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      debug: console.debug.bind(console)
    }
  }
})

function allow (program) {
  ava(`${program} allowed`, isBlocked, program, false)
}

function deny (program) {
  ava(`${program} denied`, isBlocked, program, true)
}

deny('dns.js')
deny('exec-echo.js')
deny('exec-node.js')
deny('net-bind-socket-to-file.js')
deny('net-bind-socket-to-port.js')
deny('net-connect-external.js')
deny('net-connect-localhost.js')
allow('noop.js')
deny('read-cwd-files.js')
if (process.platform === 'darwin') {
  allow('readdir-cwd.js')
} else {
  deny('readdir-cwd.js')
}
deny('readdir-home.js')
deny('readdir-root.js')
allow('stdout.js')