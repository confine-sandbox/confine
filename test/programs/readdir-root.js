module.exports = {
  onrequest: () => {
    try {
      const fs = require('fs')
      fs.readdirSync('/')
    } catch (e) {
      if (e.code === 'EPERM' || e.toString().includes('readdirSync is not a function')) {
        process.exit(1)
      }
    }
  }
}