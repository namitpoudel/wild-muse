import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <Link href={back.href} className="mb-2 inline-block text-sm underline underline-offset-4">
            ← {back.label}
          </Link>
        )}
        <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-bark">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className, actions }: { title?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-[3px] border border-sand bg-white shadow-soft", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-sand px-5 py-3.5">
          <h2 className="font-display text-xl">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[3px] border border-sand bg-white shadow-soft">
      <table className="w-full min-w-[40rem] text-sm">
        <thead>
          <tr className="border-b border-sand bg-cream/50 text-left text-xs uppercase tracking-[0.1em] text-bark">
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-3 font-semibold">
                {h === "" ? <span className="sr-only">Actions</span> : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sand/70">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top", className)}>{children}</td>;
}

/** GET-based filter bar: works without JavaScript and keeps filters shareable in the URL. */
export function FilterBar({ children, action }: { children: ReactNode; action: string }) {
  return (
    <form action={action} className="mb-4 flex flex-wrap items-end gap-3 rounded-[3px] border border-sand bg-white p-3">
      {children}
      <button type="submit" className="h-10 rounded-[2px] bg-chocolate px-4 text-xs font-semibold uppercase tracking-[0.12em] text-linen">
        Apply
      </button>
      <Link href={action} className="h-10 content-center px-2 text-xs underline">
        Reset
      </Link>
    </form>
  );
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold">
      {label}
      {children}
    </label>
  );
}

export const inputCls = "h-10 rounded-[2px] border border-sand-deep bg-white px-3 text-sm font-normal";

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
      <span className="text-bark">
        Page {page} of {pages}
      </span>
      <span className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className="rounded-[2px] border border-sand-deep px-3 py-1.5 hover:bg-cream">
            Previous
          </Link>
        )}
        {page < pages && (
          <Link href={href(page + 1)} className="rounded-[2px] border border-sand-deep px-3 py-1.5 hover:bg-cream">
            Next
          </Link>
        )}
      </span>
    </nav>
  );
}

export function Stat({ label, value, hint, big }: { label: string; value: ReactNode; hint?: ReactNode; big?: boolean }) {
  return (
    <div className="rounded-[3px] border border-sand bg-white p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-bark">{label}</p>
      <p className={cn("mt-1.5 font-display tabular-nums", big ? "text-4xl" : "text-2xl")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-bark">{hint}</p>}
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-4">
      <div className="h-10 w-72 animate-pulse rounded bg-sand" />
      <div className="h-64 animate-pulse rounded bg-sand/70" />
    </div>
  );
}

export const qs = (base: Record<string, string | undefined>, patch: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
};
