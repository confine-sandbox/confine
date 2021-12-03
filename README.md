# Confine: a secure sandboxing framework

*Work in progress*

A NodeJS framework for creating sandboxed runtimes for untrusted code. Uses OS process isolation (supported: [macos](./docs/macos.md), [linux](./docs/linux.md)) along with a pluggable runtime.

All runtimes are a subclass of [abstract-confine-runtime](https://npm.im/abstract-confine-runtime). Current runtimes include:

- [jseval-confine-runtime](https://npm.im/jseval-confine-runtime) Runs javascript with no additional sandboxing.
- [jsisolate-confine-runtime](https://npm.im/jsisolate-confine-runtime) Runs javascript in an isolate using [isolated-vm](https://github.com/laverdet/isolated-vm).
- [simplewasm-confine-runtime](https://npm.im/simplewasm-confine-runtime) Runs wasm in an isolate.

```
npm i confine-sandbox
```

Usage example:

```js
import { Sandbox } from 'confine-sandbox'

const sbx = new Sandbox(scriptPath, {
  runtime: 'jseval-confine-runtime', // the name of the runtime module; must conform to abstract-confine-runtime
  strace: false, // print an strace of the execution?
  logSpawn: false, // log the spawn() call parameters?
  noSandbox: false, // disable the process-level isolation?
  pipeStdout: false, // pipe the spawned process's stdout to the parent stdout?
  pipeStderr: false // pipe the spawned process's stderr to the parent stderr?
})
sbx.exec()
await sbx.whenFinished
```

## Work in progress

Still todo:

- [ ] A messaging bridge between the runtime process and the host environment
- [ ] A mechanism for the host environment to import and export functions

## Process isolation

Allowed access to the host environment will be tuned as the runtime environment is developed and the threats are identified. Please file issues with any concerns.

Notes:

- On MacOS, it's not currently possible to stop a readdir() on the cwd. No subsequent files can be read.