import { assertPermission } from "@/server/auth/session";
import { db } from "@/server/db";
import { getObject } from "@/server/storage";

/** Private supplier documents are only served to staff with sourcing access. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await assertPermission("sourcing.view");
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
  const doc = await db.supplierDocument.findUnique({ where: { id: (await ctx.params).id } });
  if (!doc) return new Response("Not found", { status: 404 });
  const body = await getObject(doc.storageKey, "private");
  if (!body) return new Response("Not found", { status: 404 });
  const type = doc.storageKey.endsWith(".pdf") ? "application/pdf" : doc.storageKey.endsWith(".png") ? "image/png" : "image/jpeg";
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `inline; filename="${doc.fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
