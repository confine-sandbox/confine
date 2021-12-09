module.exports = {
  onrequest: () => {
    return new Promise(r => {
      try {
        const {spawn} = require('child_process')
        spawn('echo', ['test'], {stdio: 'inherit'})
        r()
      } catch (e) {
        process.exit(1)
      }
    })
  }
}