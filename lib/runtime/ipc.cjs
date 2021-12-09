const cenc = require('compact-encoding')
const frame = require('frame-stream')
const EventEmitter = require('events')
const { pack } = require('msgpackr')

const MSGTYPE_REQUEST = 100
const MSGTYPE_RESPONSE = 101
const MSGTYPE_NOTIFY = 102
const EMPTY_BUFFER = Buffer.from([0])

exports.IPC = class IPC extends EventEmitter {
  constructor (inStream, outStream, requestHandler) {
    super()
    this._reqIdCtr = 0
    this._reqPromises = new Map()
    this.requestHandler = requestHandler

    this.framedOutStream = frame.encode()
    this.framedOutStream.pipe(outStream)
    this.framedInStream = inStream.pipe(frame.decode())
    this.framedInStream.on('data', this._onmsg.bind(this))
    inStream.on('close', this._onclose.bind(this))
    outStream.on('close', this._onclose.bind(this))
  }

  _onclose () {
    this.framedOutStream?.end()
    this.framedInStream?.end()
    this._reqPromises.forEach(req => {
      req.reject(pack({message: 'Connection closed prematurely'}))
    })
  }

  request (cid, body) {
    const reqId = ++this._reqIdCtr
    body = typeof body !== 'undefined' ? body : EMPTY_BUFFER

    const state = cenc.state()
    cenc.uint.preencode(state, MSGTYPE_REQUEST)
    cenc.uint.preencode(state, reqId)
    cenc.uint.preencode(state, cid)
    cenc.buffer.preencode(state, body)

    state.buffer = Buffer.allocUnsafe(state.end)
    cenc.uint.encode(state, MSGTYPE_REQUEST)
    cenc.uint.encode(state, reqId)
    cenc.uint.encode(state, cid)
    cenc.buffer.encode(state, body)

    this.framedOutStream.write(state.buffer)

    return new Promise((resolve, reject) => {
      this._reqPromises.set(reqId, {resolve, reject})
    })
  }

  notify (cid, body) {
    body = typeof body !== 'undefined' ? body : EMPTY_BUFFER

    const state = cenc.state()
    cenc.uint.preencode(state, MSGTYPE_NOTIFY)
    cenc.uint.preencode(state, cid)
    cenc.buffer.preencode(state, body)

    state.buffer = Buffer.allocUnsafe(state.end)
    cenc.uint.encode(state, MSGTYPE_NOTIFY)
    cenc.uint.encode(state, cid)
    cenc.buffer.encode(state, body)

    this.framedOutStream.write(state.buffer)
  }

  _respond (reqId, success, body) {
    body = typeof body !== 'undefined' ? body : EMPTY_BUFFER

    const state = cenc.state()
    cenc.uint.preencode(state, MSGTYPE_RESPONSE)
    cenc.uint.preencode(state, reqId)
    cenc.bool.preencode(state, success)
    cenc.buffer.preencode(state, body)

    state.buffer = Buffer.allocUnsafe(state.end)
    cenc.uint.encode(state, MSGTYPE_RESPONSE)
    cenc.uint.encode(state, reqId)
    cenc.bool.encode(state, success)
    cenc.buffer.encode(state, body)

    // console.error('_respond', reqId, success, body)
    this.framedOutStream.write(state.buffer)
  }

  _onmsg (buffer) {
    // console.error('_onmsg', buffer)
    const state = {start: 0, end: buffer.length, buffer}
    const msgtype = cenc.uint.decode(state)
    if (msgtype === MSGTYPE_REQUEST) {
      const reqId = cenc.uint.decode(state)
      const cid = cenc.uint.decode(state)
      const body = cenc.buffer.decode(state)
      this.requestHandler(cid, body).then(
        body => this._respond(reqId, true, body),
        body => this._respond(reqId, false, body)
      )
    } else if (msgtype === MSGTYPE_RESPONSE) {
      const reqId = cenc.uint.decode(state)
      const success = cenc.bool.decode(state)
      const body = cenc.buffer.decode(state)
      const promise = this._reqPromises.get(reqId)
      if (!promise) return console.error(`No response waiting for request ${reqId}`)
      if (success) promise.resolve(body)
      else promise.reject(body)
    } else if (msgtype === MSGTYPE_NOTIFY) {
      const cid = cenc.uint.decode(state)
      const body = cenc.buffer.decode(state)
      this.requestHandler(cid, body)
    } else {
      console.error(`Unknown message type ID: ${msgtype}`)
    }
  }
}
