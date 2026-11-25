"use client";

import { Expand } from "lucide-react";
import { useRef, useState } from "react";
import { MediaImage } from "@/components/brand/artwork";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { MediaAsset } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

/**
 * Product gallery: thumbnails + hover zoom on desktop, swipeable scroll-snap on mobile,
 * full-screen view on click. Uploaded videos (Stage 4) render as muted inline players.
 */
export function ProductGallery({ images, name }: { images: MediaAsset[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [full, setFull] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = scroller.current;
    if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="lg:sticky lg:top-32 lg:grid lg:grid-cols-[5rem_1fr] lg:gap-4">
      <ul className="hidden flex-col gap-3 lg:flex" aria-label="Product images">
        {images.map((m, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={active === i}
              className={cn(
                "block aspect-[4/5] w-full overflow-hidden rounded-[2px] ring-offset-2 ring-offset-linen",
                active === i ? "ring-2 ring-chocolate" : "opacity-75 hover:opacity-100",
              )}
            >
              <MediaImage media={{ ...m, alt: "" }} />
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop: single stage with zoom */}
      <div
        className="relative hidden aspect-[4/5] cursor-zoom-in overflow-hidden rounded-[2px] bg-sand lg:block"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
        onClick={() => setFull(true)}
      >
        <div
          className="h-full w-full transition-transform duration-200 ease-out"
          style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        >
          <MediaImage media={images[active]} priority />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFull(true);
          }}
          className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-linen/90 shadow-soft"
          aria-label="View full screen"
        >
          <Expand className="size-4" />
        </button>
      </div>

      {/* Mobile/tablet: swipe */}
      <div className="lg:hidden">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="-mx-4 flex snap-x snap-mandatory overflow-x-auto scrollbar-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta md:mx-0"
          role="region"
          tabIndex={0}
          aria-label={`${name} images, swipe or use arrow keys to see more`}
        >
          {images.map((m, i) => (
            <div key={i} className="aspect-[4/5] w-full shrink-0 snap-center bg-sand" onClick={() => setFull(true)}>
              <MediaImage media={m} priority={i === 0} />
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
          {images.map((_, i) => (
            <span key={i} className={cn("h-1.5 rounded-full transition-all", active === i ? "w-5 bg-chocolate" : "w-1.5 bg-sand-deep")} />
          ))}
        </div>
      </div>

      <Dialog open={full} onOpenChange={setFull}>
        <DialogContent title={name} className="max-w-3xl p-3 md:p-4">
          <div className="mx-auto aspect-[4/5] max-h-[75vh] overflow-hidden rounded-[2px]">
            <MediaImage media={images[active]} />
          </div>
          <div className="mt-3 flex justify-center gap-2">
            {images.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={cn("size-14 overflow-hidden rounded-[2px]", active === i ? "ring-2 ring-chocolate" : "opacity-70")}
                aria-label={`Show image ${i + 1}`}
              >
                <MediaImage media={{ ...m, alt: "" }} />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
