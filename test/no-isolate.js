import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import net from 'net'
import { Sandbox } from '../lib/index.js'

const __dirname = join(dirname(fileURLToPath(import.meta.url)))

// create a socket for attempted connections
const sock = net.createServer(conn => conn.end())
sock.listen(5000)
sock.unref()

;(async function () {
  for (const programName of fs.readdirSync(join(__dirname, 'programs'))) {
    const sbx = new Sandbox(join(__dirname, 'programs', programName), {pipeStdout: false, pipeStderr: false})
    sbx.exec()
    await sbx.whenFinished
    console.log(programName, sbx.exitCode === 0 ? 'ALLOWED' : 'DENIED')
  }
})()
