import { NextResponse, type NextRequest } from "next/server";
import { unsubscribe } from "@/server/newsletter";

/** One-click unsubscribe (GET from the email link, POST for RFC 8058 List-Unsubscribe-Post). */
async function handle(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const done = token.length > 10 && token.length < 100 ? await unsubscribe(token) : false;
  return NextResponse.redirect(new URL(done ? "/newsletter/unsubscribed" : "/newsletter/invalid", req.url), 303);
}
export const GET = handle;
export const POST = handle;
