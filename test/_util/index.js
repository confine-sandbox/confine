import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { Sandbox } from '../../lib/index.js'

const __dirname = join(dirname(fileURLToPath(import.meta.url)))

export function genIsBlocked (opts) {
  return async function (t, input, expected) {
    const sbx = new Sandbox(join(__dirname, '..', 'programs', input), opts)
    sbx.exec()
    await sbx.whenFinished
    if (expected) {
      t.not(sbx.exitCode, 0)
    } else {
      t.is(sbx.exitCode, 0)
    }
  }
}
