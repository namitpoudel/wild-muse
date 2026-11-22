import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <span className="mb-5 grid size-16 place-items-center rounded-full bg-sand/70 text-terracotta">
        <Icon className="size-7" strokeWidth={1.5} aria-hidden />
      </span>
      <h3 className="font-display text-2xl">{title}</h3>
      {children && <div className="mt-2 max-w-sm text-sm text-bark">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
