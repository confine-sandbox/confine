# Linux process isolation

For Linux, we use seccomp to restrict access to the host environment. After the runtime has initialized itself, the seccomp sandbox is created.

The seccomp uses an allowlist (default deny) with the following allowed syscalls:

- `close`
- `epoll_create`
- `epoll_ctl`
- `epoll_wait`
- `exit`
- `exit_group`
- `fcntl`
- `fcntl64`
- `fstat`
- `fstat64`
- `fstatat64`
- `futex`
- `getcwd`
- `getsockname`
- `getsockopt`
- `ioctl`
- `madvise`
- `mprotect`
- `munmap`
- `openat`
- `read`
- `rt_sigaction`
- `rt_sigpending`
- `rt_sigprocmask`
- `rt_sigqueueinfo`
- `rt_sigreturn`
- `rt_sigsuspend`
- `rt_sigtimedwait`
- `rt_tgsigqueueinfo`
- `sendmsg`
- `write`
- `writev`