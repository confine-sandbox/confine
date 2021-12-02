const net = require('net')
const server = net.createServer((c) => {})
server.listen(12345, () => {
  console.log('server bound')
  process.exit(0)
})