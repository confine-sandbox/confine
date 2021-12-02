import child from 'child_process'

export function exec (sbx) {
  const runtimePathSegments = sbx.runtimePath.split('/').filter(Boolean)
  const runtimePathVariations = []
  const acc = []
  for (const segment of runtimePathSegments) {
    acc.push(segment)
    runtimePathVariations.push(`/${acc.join('/')}`)
  }

  const profile = `(version 1)
(debug allow)
(deny default)

; v8 needs to read the kernel version
(allow sysctl-read)

; nodejs needs to run cwd()
(allow file-read* (literal "${process.cwd()}"))

; nodejs needs to read the runtime script
; this appears to require running lstat up the path chain (presumably to check for symlinks?)
(allow file-read* (literal "${sbx.runtimePath}"))
${runtimePathVariations.map(str => `(allow file-read-metadata (literal "${str}"))`).join('\n')}

; the runtime needs to be able to read the executed script
(allow file-read* (literal "${sbx.scriptPath}"))

; allow nodejs to run
(allow process-exec (literal "${process.execPath}"))`

  const childProcess = logSpawn(
    'sandbox-exec',
    [
      '-p', profile,
      process.execPath, sbx.runtimePath, sbx.scriptPath
    ]
  )
  return childProcess
}

function logSpawn (...args) {
  // console.log('SPAWN', args)
  return child.spawn(...args)
}
