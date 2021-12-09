module.exports = {
  onrequest: () => {
    return new Promise(r => {
      try {
        require('dns').lookup('example.com', (err, res) => {
          if (err?.code === 'ENOTFOUND') {
            process.exit(1) // this is the expected failure
          }
          console.log('dns', err, res)
          r()
        })
      } catch (e) {
        process.exit(1)
      }
    })
  }
}