import "server-only";
import type { z } from "zod";
import { fail, ok, zodFieldErrors, type ActionResult } from "@/app/actions/result";
import { assertPermission, AuthError, type CurrentUser } from "../auth/session";
import type { Permission } from "../auth/permissions";
import { expire } from "../cache";

/**
 * Wrapper for every admin mutation:
 *   1. re-checks the session and the specific permission on the server
 *   2. validates input with a zod schema
 *   3. runs the handler, then expires the given cache tags
 * Handlers call audit() themselves with the before/after details they know about.
 */
export function adminAction<S extends z.ZodType, R>(
  permission: Permission,
  schema: S,
  handler: (input: z.infer<S>, actor: CurrentUser) => Promise<R | ActionResult<R>>,
  opts: { tags?: string[]; message?: string } = {},
) {
  return async (raw: unknown): Promise<ActionResult<R>> => {
    let actor: CurrentUser;
    try {
      actor = await assertPermission(permission);
    } catch (e) {
      return fail(e instanceof AuthError ? e.message : "Not allowed.");
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return fail("Please check the highlighted fields.", zodFieldErrors(parsed.error.issues));
    try {
      const out = await handler(parsed.data, actor);
      if (out && typeof out === "object" && "ok" in (out as object)) {
        if ((out as ActionResult<R>).ok && opts.tags) expire(...opts.tags);
        return out as ActionResult<R>;
      }
      if (opts.tags) expire(...opts.tags);
      return ok(out as R, opts.message ?? "Saved");
    } catch (e) {
      if (e instanceof AdminError) return fail(e.message);
      const code = (e as { code?: string }).code;
      if (code === "P2002") return fail("That value is already in use (must be unique).");
      if (code === "P2003") return fail("This record is linked to other data and can't be removed.");
      console.error(`[admin:${permission}]`, e);
      return fail("Something went wrong. Nothing was saved.");
    }
  };
}

export class AdminError extends Error {}

/** FormData → plain object (repeated keys become arrays; "on" checkboxes become true). */
export function formToObject(fd: FormData) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (v instanceof File) continue;
    const val = v === "on" ? true : v;
    if (k in out) out[k] = ([] as unknown[]).concat(out[k], val);
    else out[k] = val;
  }
  return out;
}
