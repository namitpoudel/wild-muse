import { NextResponse, type NextRequest } from "next/server";
import { confirmSubscription } from "@/server/newsletter";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const res = token.length > 10 && token.length < 100 ? await confirmSubscription(token) : null;
  return NextResponse.redirect(new URL(res ? "/newsletter/confirmed" : "/newsletter/invalid", req.url));
}
