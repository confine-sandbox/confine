# Isolated Sandbox

*work in progress*

A JS runtime which uses V8 isolates ([isolated-vm](https://github.com/laverdet/isolated-vm)) and OS process isolation (supported: [macos](./docs/macos.md), [linux](./docs/linux.md)) to securely execute untrusted code.

## Process isolation

Allowed access to the host environment will be tuned as the runtime environment is developed and the threats are identified. Please file issues with any concerns.

Notes:

- On MacOS, it's not currently possible to stop a readdir() on the cwd. No subsequent files can be read.