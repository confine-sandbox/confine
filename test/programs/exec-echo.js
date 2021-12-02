const {spawn} = require('child_process')

spawn('echo', ['test'], {stdio: 'inherit'})
