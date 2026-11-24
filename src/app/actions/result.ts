/** Uniform result shape for server actions consumed by client components. */
export type ActionResult<T = undefined> =
  { ok: true; data: T; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const ok = <T>(data: T, message?: string): ActionResult<T> => ({ ok: true, data, message });
export const fail = (error: string, fieldErrors?: Record<string, string>): ActionResult<never> => ({ ok: false, error, fieldErrors });

export function zodFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = i.path.length ? i.path.map(String).join(".") : "form";
    out[k] ??= i.message;
  }
  return out;
}
