const ava = require('ava')
const { genIsBlocked } = require('./_util/index.js')

const isBlocked = genIsBlocked({runtime: 'simplewasm-confine-runtime', noSandbox: true})

function allow (program) {
  ava(`${program} allowed`, isBlocked, program, false)
}

function deny (program) {
  ava(`${program} denied`, isBlocked, program, true)
}

// TODO
// allow('fizzbuzz.wasm')