import ava from 'ava'
import net from 'net'
import { isBlockedNoSandbox } from './_util/index.js'

// create a socket for attempted connections
const sock = net.createServer(conn => conn.end())
sock.listen(5000)
sock.unref()

function allow (program) {
  ava(`${program} allowed`, isBlockedNoSandbox, program, false)
}

function deny (program) {
  ava(`${program} denied`, isBlockedNoSandbox, program, true)
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