import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { CurrentUser } from "../auth/session";
import { db } from "../db";
import { clientIp } from "./rate-limit";

/** Append-only audit trail for every administrative change. */
export async function audit(
  actor: CurrentUser | null,
  action: string,
  entity: { type: string; id?: string | null },
  details?: { summary?: string; before?: unknown; after?: unknown },
  tx: Prisma.TransactionClient = db,
) {
  await tx.auditLog.create({
    data: {
      actorId: actor?.id ?? null,
      actorEmail: actor?.email ?? "system",
      action,
      entityType: entity.type,
      entityId: entity.id ?? null,
      summary: details?.summary,
      before: details?.before === undefined ? undefined : (JSON.parse(JSON.stringify(details.before)) as Prisma.InputJsonValue),
      after: details?.after === undefined ? undefined : (JSON.parse(JSON.stringify(details.after)) as Prisma.InputJsonValue),
      ip: await clientIp().catch(() => null),
    },
  });
}
