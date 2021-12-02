const {spawn} = require('child_process')

spawn(process.execPath, ['-e', 'console.log("test")'], {stdio: 'inherit'})
