import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
  headingLevel = 2,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** 2 when the empty state sits directly under the page title, 3 inside a titled section. */
  headingLevel?: 2 | 3;
}) {
  const H = `h${headingLevel}` as const;
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <span className="mb-5 grid size-16 place-items-center rounded-full bg-sand/70 text-terracotta">
        <Icon className="size-7" strokeWidth={1.5} aria-hidden />
      </span>
      <H className="font-display text-2xl">{title}</H>
      {children && <div className="mt-2 max-w-sm text-sm text-bark">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
