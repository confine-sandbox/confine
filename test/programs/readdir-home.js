module.exports = {
  runTest: () => {
    try {
      const fs = require('fs')
      console.log(fs.readdirSync(require('os').homedir()))
    } catch (e) {
      if (e.code === 'EPERM' || e.toString().includes('homedir is not a function')) {
        process.exit(1)
      }
      console.log(e)
    }
  }
}