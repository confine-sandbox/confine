module.exports = {
  onrequest: () => {
    try {
      const fs = require('fs')
      console.log(fs.readdirSync(process.cwd()))
    } catch (e) {
      if (e.toString().includes('readdirSync is not a function')) {
        process.exit(1)
      }
      console.log(e)
    }
  }
}