const fs = require('fs')
const scriptPath = process.argv[2]
const scriptSource = fs.readFileSync(scriptPath, 'utf-8')
eval(scriptSource)