import { applyEnvFallbacks } from "@/lib/env-fallbacks";

/** Runs once when each server instance starts, before any request: fill settings from integrations. */
export function register() {
  applyEnvFallbacks(process.env);
}
