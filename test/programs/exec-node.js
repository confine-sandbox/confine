module.exports = {
  onrequest: () => {
    return new Promise(r => {
      try {
        const {spawn} = require('child_process')
        spawn(process.execPath, ['-e', 'console.log("test")'], {stdio: 'inherit'})
        r()
      } catch (e) {
        process.exit(1)
      }
    })
  }
}