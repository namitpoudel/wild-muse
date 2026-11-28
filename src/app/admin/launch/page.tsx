import Link from "next/link";
import { Suspense } from "react";
import { CircleAlert, CircleCheck, CircleDashed } from "lucide-react";
import { connectStripeWebhookAction } from "./actions";
import { AdminForm, Submit } from "@/components/admin/admin-form";
import { AdminHeader, AdminSkeleton, Card } from "@/components/admin/ui";
import { requirePermission } from "@/server/auth/session";
import { getLaunchReadiness, type ReadinessStatus } from "@/server/admin/launch-readiness";

export const metadata = { title: "Launch readiness" };

const ICON: Record<ReadinessStatus, { Icon: typeof CircleCheck; label: string; className: string }> = {
  done: { Icon: CircleCheck, label: "Done", className: "text-olive" },
  warning: { Icon: CircleAlert, label: "Check", className: "text-[#8a6410]" },
  todo: { Icon: CircleDashed, label: "To do", className: "text-terracotta" },
};

export default function LaunchPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Launch />
    </Suspense>
  );
}

async function Launch() {
  await requirePermission("settings.manage", "/admin/launch");
  const { items, live } = await getLaunchReadiness();
  const todo = items.filter((i) => i.status === "todo").length;
  const warn = items.filter((i) => i.status === "warning").length;
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Launch readiness"
        description={
          todo
            ? `${todo} item(s) to finish and ${warn} to check before taking real orders. The full launch checklist is in docs/07.`
            : warn
              ? `Nothing blocking — ${warn} item(s) worth checking.`
              : "Everything here is ready."
        }
      />
      {!live && (
        <p className="rounded-[2px] border border-sand bg-cream p-4 text-sm text-bark">
          This is not the live site, so hosting settings show development values. They are checked again — and a production deploy is stopped if any
          are wrong — when the shop is deployed.
        </p>
      )}
      {groups.map((g) => (
        <Card key={g} title={g}>
          <ul className="divide-y divide-sand/70">
            {items
              .filter((i) => i.group === g)
              .map((i) => {
                const { Icon, label, className } = ICON[i.status];
                return (
                  <li key={i.id} className="flex gap-3 py-3">
                    <Icon className={`mt-0.5 size-5 shrink-0 ${className}`} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-chocolate">
                        <span className="sr-only">{label}: </span>
                        {i.label}
                      </p>
                      {i.detail && <p className="mt-0.5 break-words text-sm text-bark">{i.detail}</p>}
                      {i.action === "connect-stripe-webhook" && (
                        <AdminForm action={connectStripeWebhookAction} className="mt-3">
                          <Submit>{i.status === "done" ? "Reconnect Stripe webhook" : "Connect Stripe webhook"}</Submit>
                        </AdminForm>
                      )}
                    </div>
                    {i.href && (
                      <Link
                        href={i.href}
                        prefetch={false}
                        className="shrink-0 self-center text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
                      >
                        Open<span className="sr-only"> {i.label}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
          </ul>
        </Card>
      ))}
    </div>
  );
}
