import { EventEmitter } from 'events'
import { Server } from 'net'
import { ChildProcess } from 'child_process'

export declare interface SandboxConstructorOpts {
  runtime?: string
  globals?: any
  strace?: boolean
  logSpawn?: boolean
  noSandbox?: boolean
  pipeStdout?: boolean
  pipeStderr?: boolean
}

export declare interface SandboxExecContainerOpts {
  source?: string
  sourcePath?: string
}

export declare interface ConfineContainer {
  cid: number
  opts?: any
}

export type ConfineIPC = any

export declare class Sandbox extends EventEmitter {
  opts: SandboxConstructorOpts
  guestProcess?: ChildProcess
  ipcServer?: Server
  ipcServerPort?: number
  ipcClientPort?: number
  ipc?: ConfineIPC
  whenGuestProcessClosed: Promise<number>
  globalsMap: Map<string, Function>

  constructor (opts: SandboxConstructorOpts)
  get guestExitCode (): number
  get guestExitSignal (): string
  get isGuestProcessActive (): boolean
  get runtimePath (): string
  init (): Promise<void>
  teardown (): Promise<number>
  listContainers (): Promise<ConfineContainer[]>
  execContainer (opts: SandboxExecContainerOpts|any): Promise<ConfineContainer>
  killContainer (container: ConfineContainer): Promise<void>
  handleAPICall (cid: number, methodName: string, params: any[]): Promise<any>
}