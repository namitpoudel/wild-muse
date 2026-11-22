import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  href,
  linkLabel = "View all",
  align = "left",
  className,
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  href?: string;
  linkLabel?: string;
  align?: "left" | "center";
  className?: string;
  id?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 md:mb-10",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn(align === "center" && "max-w-2xl")}>
        {eyebrow && <p className="eyebrow mb-3 text-terracotta">{eyebrow}</p>}
        <h2 id={id} className="font-display text-display-md font-normal">
          {title}
        </h2>
        {intro && <p className="mt-3 max-w-xl text-bark">{intro}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-chocolate underline-offset-[6px] hover:underline"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      )}
    </div>
  );
}
