import { Suspense } from "react";
import { AdminHeader, AdminSkeleton, FilterBar, FilterField, inputCls, Pagination, qs, Table, Td } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";

export const metadata = { title: "Audit log" };
const dt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export default function AuditPage({ searchParams }: PageProps<"/admin/audit-log">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Audit searchParams={searchParams} />
    </Suspense>
  );
}

async function Audit({ searchParams }: Pick<PageProps<"/admin/audit-log">, "searchParams">) {
  await requirePermission("audit.view", "/admin/audit-log");
  const sp = (await searchParams) as Record<string, string | undefined>;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.AuditLogWhereInput = {
    ...(sp.entity ? { entityType: sp.entity } : {}),
    ...(sp.q
      ? {
          OR: [
            { action: { contains: sp.q } },
            { summary: { contains: sp.q, mode: "insensitive" } },
            { actorEmail: { contains: sp.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const take = 50;
  const [rows, total, entities] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * take, take }),
    db.auditLog.count({ where }),
    db.auditLog.groupBy({ by: ["entityType"] }),
  ]);
  return (
    <div>
      <AdminHeader title="Audit log" description="An append-only record of every administrative change — who did what, and when." />
      <FilterBar action="/admin/audit-log">
        <FilterField label="Search">
          <input name="q" defaultValue={sp.q} placeholder="Action, summary or email" className={inputCls} />
        </FilterField>
        <FilterField label="Record type">
          <select name="entity" defaultValue={sp.entity ?? ""} className={inputCls}>
            <option value="">All</option>
            {entities.map((e) => (
              <option key={e.entityType}>{e.entityType}</option>
            ))}
          </select>
        </FilterField>
      </FilterBar>
      <Table head={["When", "Who", "Action", "Details"]}>
        {rows.map((r) => (
          <tr key={r.id}>
            <Td className="whitespace-nowrap text-xs">{dt.format(r.createdAt)}</Td>
            <Td className="text-xs">{r.actorEmail}</Td>
            <Td className="font-mono text-xs">{r.action}</Td>
            <Td className="text-xs">
              {r.summary}
              {(r.before !== null || r.after !== null) && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-bark">changes</summary>
                  <pre className="mt-1 max-w-xl overflow-x-auto whitespace-pre-wrap rounded bg-cream p-2 text-[0.65rem]">
                    {JSON.stringify({ before: r.before, after: r.after }, null, 2).slice(0, 4000)}
                  </pre>
                </details>
              )}
            </Td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / take))} href={(n) => `/admin/audit-log${qs(sp, { page: n })}`} />
    </div>
  );
}
