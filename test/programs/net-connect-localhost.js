const sock = require('net').connect(5000)
sock.on('connect', () => {
  console.log('socket connected')
  process.exit(0)
})
sock.on('error', err => {
  if (err.code === 'ENOTFOUND') {
    process.exit(1) // this is the expected failure
  }
  console.log('socket error', err)
})
sock.on('end', () => console.log('socket ended'))