import { getObject } from "@/server/storage";

/** Serves PUBLIC media stored by the local storage driver (Supabase serves its own public URLs). */
const TYPES: Record<string, string> = { webp: "image/webp", mp4: "video/mp4", webm: "video/webm", png: "image/png", jpg: "image/jpeg" };

export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const key = (await ctx.params).key.join("/");
  const ext = key.split(".").pop() ?? "";
  if (!TYPES[ext]) return new Response("Not found", { status: 404 });
  const body = await getObject(key, "public");
  if (!body) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(body), {
    headers: { "Content-Type": TYPES[ext], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
