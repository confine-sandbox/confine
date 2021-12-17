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
    const runtimeOpts = opts.runtimeOpts || {}
    runtimeOpts.sourcePath = join(__dirname, '..', 'programs', input)
    const {cid} = await sbx.execContainer(runtimeOpts)
    await sbx.handleAPICall(cid, 'runTest', []).catch(e => e)
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
