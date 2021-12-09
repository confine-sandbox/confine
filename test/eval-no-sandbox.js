const ava = require('ava')
const net = require('net')
const { genIsBlocked } = require('./_util/index.js')

// create a socket for attempted connections
const sock = net.createServer(conn => conn.end())
sock.listen(5000)
sock.unref()

const isBlocked = genIsBlocked({noSandbox: true, runtime: 'jseval-confine-runtime', pipeStdout: true, pipeStderr: true})

function allow (program) {
  ava(`${program} allowed`, isBlocked, program, false)
}

function deny (program) {
  ava(`${program} denied`, isBlocked, program, true)
}

allow('dns.js')
allow('exec-echo.js')
allow('exec-node.js')
allow('net-bind-socket-to-file.js')
allow('net-bind-socket-to-port.js')
allow('net-connect-external.js')
allow('net-connect-localhost.js')
allow('noop.js')
allow('read-cwd-files.js')
allow('readdir-cwd.js')
allow('readdir-home.js')
allow('readdir-root.js')
allow('stdout.js')