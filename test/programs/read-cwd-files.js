const {join} = require('path')
const fs = require('fs')
const names = fs.readdirSync(process.cwd())
for (const name of names) {
  const path = join(process.cwd(), name)
  if (fs.statSync(path).isFile()) {
    console.log(typeof fs.readFileSync(path))
  }
}