module.exports = {
  runTest: () => {
    return new Promise(r => {
      try {
        const net = require('net')
        const server = net.createServer((c) => {})
        server.listen('/tmp/server' + Date.now() + '.sock', () => {
          console.log('server bound')
          r()
        })
      } catch (e) {
        process.exit(1)
      }
    })
  }
}