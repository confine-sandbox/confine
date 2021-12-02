const net = require('net')
const server = net.createServer((c) => {})
server.listen('/tmp/server' + Date.now() + '.sock', () => {
  console.log('server bound')
  process.exit(0)
})