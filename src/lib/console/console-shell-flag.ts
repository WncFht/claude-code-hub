export function isOctopusConsoleShellEnabled() {
  return process.env.ENABLE_OCTOPUS_CONSOLE_SHELL === "true";
}
