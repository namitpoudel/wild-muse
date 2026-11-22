import { discountPercent, formatPence } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({
  pricePence,
  compareAtPence,
  className,
  size = "md",
  showSaving = true,
}: {
  pricePence: number;
  compareAtPence?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  showSaving?: boolean;
}) {
  const pct = discountPercent(pricePence, compareAtPence);
  const text = { sm: "text-sm", md: "text-[0.95rem]", lg: "text-2xl" }[size];
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn("font-semibold", text, pct && "text-terracotta")}>
        {pct && <span className="sr-only">Sale price </span>}
        {formatPence(pricePence)}
      </span>
      {pct && compareAtPence && (
        <>
          <s className={cn("text-bark", size === "lg" ? "text-lg" : "text-sm")}>
            <span className="sr-only">Was </span>
            {formatPence(compareAtPence)}
          </s>
          {showSaving && <span className="text-xs font-bold text-terracotta">−{pct}%</span>}
        </>
      )}
    </p>
  );
}
