# Confine: a secure sandboxing framework

*Work in progress*

A NodeJS framework for creating sandboxed runtimes for untrusted code. Uses OS process isolation (supported: [macos](./docs/macos.md), [linux](./docs/linux.md)) along with a pluggable runtime.

All runtimes are a subclass of [abstract-confine-runtime](https://npm.im/abstract-confine-runtime). Current runtimes include:

- [js-eval-confine-runtime](https://npm.im/js-eval-confine-runtime) Runs javascript with no additional sandboxing.
- [js-isolate-confine-runtime](https://npm.im/js-isolate-confine-runtime) Runs javascript in an isolate using [isolated-vm](https://github.com/laverdet/isolated-vm).
- [simple-wasm-confine-runtime](https://npm.im/simple-wasm-confine-runtime) Runs wasm in an isolate.

## Process isolation

Allowed access to the host environment will be tuned as the runtime environment is developed and the threats are identified. Please file issues with any concerns.

Notes:

- On MacOS, it's not currently possible to stop a readdir() on the cwd. No subsequent files can be read.