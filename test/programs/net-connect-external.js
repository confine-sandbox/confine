module.exports = {
  onrequest: () => {
    return new Promise(r => {
      try {
        const sock = require('net').connect(80, 'example.com')
        sock.on('connect', () => {
          console.log('socket connected')
          r()
        })
        sock.on('error', err => {
          if (err.code === 'ENOTFOUND') {
            process.exit(1) // this is the expected failure
          }
          console.log('socket error', err)
        })
        sock.on('end', () => console.log('socket ended'))
      } catch (e) {
        if (e.toString().includes('connect is not a function')) {
          process.exit(1)
        }
        console.log(e)
      }
    })
  }
}