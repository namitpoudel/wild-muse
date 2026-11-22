import type { NextRequest } from "next/server";
import { getSuggestions } from "@/lib/catalog/search";

/**
 * GET /api/search/suggest?q=… — live search suggestions.
 * Input is length-limited; output contains only public catalogue data.
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 80).trim();
  if (q.length < 2) return Response.json({ products: [], categories: [], total: 0 });
  const data = await getSuggestions(q);
  return Response.json(data, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
