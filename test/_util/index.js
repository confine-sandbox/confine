import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import net from 'net'
import { Sandbox } from '../../lib/index.js'

const __dirname = join(dirname(fileURLToPath(import.meta.url)))

export async function isBlocked (t, input, expected) {
  const sbx = new Sandbox(join(__dirname, '..', 'programs', input), {pipeStdout: false, pipeStderr: false})
  sbx.exec()
  await sbx.whenFinished
  if (expected) {
    t.not(sbx.exitCode, 0)
  } else {
    t.is(sbx.exitCode, 0)
  }
}

export async function isBlockedNoSandbox (t, input, expected) {
  const sbx = new Sandbox(join(__dirname, '..', 'programs', input), {noSandbox: true, pipeStdout: false, pipeStderr: false})
  sbx.exec()
  await sbx.whenFinished
  if (expected) {
    t.not(sbx.exitCode, 0)
  } else {
    t.is(sbx.exitCode, 0)
  }
}