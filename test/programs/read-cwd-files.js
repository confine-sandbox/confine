module.exports = {
  runTest: () => {
    try {
      const {join} = require('path')
      const fs = require('fs')
      const names = fs.readdirSync(process.cwd())
      for (const name of names) {
        const path = join(process.cwd(), name)
        if (fs.statSync(path).isFile()) {
          console.log(typeof fs.readFileSync(path))
        }
      }
    } catch (e) {
      if (e.code === 'EPERM' || e.toString().includes('readdirSync is not a function')) {
        process.exit(1)
      }
    }
  }
}