/**
 * Next.js instrumentation entrypoint.
 * Keep this file runtime-agnostic and delegate Node-specific work lazily.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { register } = await import("./instrumentation-node");
    return register();
  }
}
