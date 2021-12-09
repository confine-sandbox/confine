# MacOS process isolation

For MacOS, we use Seatbelt. Apple claims that [Seatbelt is deprecated](https://stackoverflow.com/questions/56703697/how-to-sandbox-third-party-applications-when-sandbox-exec-is-deprecated-now) in favor of the "App Sandbox," but what this really means is that some useful tools such as the trace api and `sandbox-simplify` command have been removed without an alternative while the core of Seatbelt still works. Thanks, Apple.

We isolate the runtime by using `sandbox-exec` with a policy file that's generated at runtime. The policy file restricts the runtime to reading sysctl (v8 needs to read the kernel version), calling exec on node, allowing various file reads necessary to start the runtime, and allowing access to two local network ports which are used for messaging.

## Resources

 - [Apple Sandbox Guide 1.0](https://reverse.put.as/wp-content/uploads/2011/09/Apple-Sandbox-Guide-v1.0.pdf)
 - [OSX Sandbox Seatbelt Profiles](https://github.com/s7ephen/OSX-Sandbox--Seatbelt--Profiles)