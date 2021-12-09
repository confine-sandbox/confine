const { join } = require('path')
const fs = require('fs').promises
const { Sandbox } = require('../../lib/index.js')
const { unpack } = require('msgpackr')

exports.genIsBlocked = (opts) => {
  return async function (t, input, expected) {
    const sbx = new Sandbox(opts)
    sbx.on('container-runtime-error', ({cid, error}) => {
      console.error('Script error:', error)
    })
    await sbx.init()
    try {
      const {cid} = await sbx.execContainer({sourcePath: join(__dirname, '..', 'programs', input)})
      await sbx.ipc.request(cid, Buffer.from([0])).catch(e => e)
    } catch (e) {
      if (Buffer.isBuffer(e)) {
        throw new Error(unpack(e).message)
      } else {
        throw e
      }
    }
    if (expected) {
      await sbx.whenGuestProcessClosed
      t.falsy(sbx.isGuestProcessActive)
      if (process.platform === 'linux') {
        t.is(sbx.guestExitSignal, 'SIGSYS')
      } else {
        t.not(sbx.guestExitCode, 0)
      }
    } else {
      t.truthy(sbx.isGuestProcessActive)
      await sbx.teardown()
    }
  }
}
