module.exports = {
  runTest: () => {
    return new Promise(r => {
      try {
        const net = require('net')
        const server = net.createServer((c) => {})
        server.listen(12345, () => {
          console.log('server bound')
          r()
        })
      } catch (e) {
        process.exit(1)
      }
    })
  }
}