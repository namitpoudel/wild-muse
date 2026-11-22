"use client";

import { Ruler } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { sizeGuides } from "@/config/size-guides";

export function SizeGuideDialog({ guideKey }: { guideKey: string }) {
  const guide = sizeGuides[guideKey] ?? sizeGuides["one-size"];
  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-4 hover:text-terracotta">
        <Ruler className="size-3.5" aria-hidden /> Size guide
      </DialogTrigger>
      <DialogContent title={guide.title} description={guide.note}>
        {guide.rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{guide.title}</caption>
              <thead>
                <tr className="border-b border-chocolate text-left">
                  {guide.columns.map((c) => (
                    <th key={c} scope="col" className="py-2 pr-3 font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guide.rows.map((r) => (
                  <tr key={r[0]} className="border-b border-sand even:bg-cream/60">
                    {r.map((cell, i) =>
                      i === 0 ? (
                        <th key={i} scope="row" className="py-2 pr-3 text-left font-semibold">
                          {cell}
                        </th>
                      ) : (
                        <td key={i} className="py-2 pr-3 tabular-nums">
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-bark">
          Handmade pieces can vary by 1–2 cm. Not sure? Use &ldquo;Ask about this product&rdquo; and we&apos;ll measure it for you.
        </p>
      </DialogContent>
    </Dialog>
  );
}
