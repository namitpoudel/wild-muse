import { exportMyData } from "@/server/account";
import { getCurrentUser } from "@/server/auth/session";

/** UK GDPR data portability: download the signed-in customer's data as JSON. */
export async function GET() {
  if (!(await getCurrentUser())) return new Response("Please sign in", { status: 401 });
  const data = await exportMyData();
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="wild-muse-my-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
