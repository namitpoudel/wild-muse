import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Displays a real rating aggregate. Renders nothing when there are no reviews — we never fake ratings. */
export function StarRating({
  average,
  count,
  className,
  showCount = true,
}: {
  average: number;
  count: number;
  className?: string;
  showCount?: boolean;
}) {
  if (count === 0) return null;
  const label = `Rated ${average.toFixed(1)} out of 5 from ${count} review${count === 1 ? "" : "s"}`;
  return (
    <div className={cn("flex items-center gap-1.5", className)} role="img" aria-label={label}>
      <div className="relative flex" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="size-3.5 text-sand-deep" fill="currentColor" strokeWidth={0} />
        ))}
        <div className="absolute inset-0 flex overflow-hidden" style={{ width: `${(average / 5) * 100}%` }}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className="size-3.5 shrink-0 text-mustard" fill="currentColor" strokeWidth={0} />
          ))}
        </div>
      </div>
      {showCount && <span className="text-xs text-bark">({count})</span>}
    </div>
  );
}
