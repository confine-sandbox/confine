import ava from 'ava'
import net from 'net'
import { genIsBlocked } from './_util/index.js'

// create a socket for attempted connections
const sock = net.createServer(conn => conn.end())
sock.listen(5000)
sock.unref()

const isBlocked = genIsBlocked({runtime: 'v8-isolate', noSandbox: true})

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
deny('readdir-cwd.js')
deny('readdir-home.js')
deny('readdir-root.js')
allow('stdout.js')