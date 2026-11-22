"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

/** Rotating announcement messages (admin-editable in Stage 4). Pauses on hover/focus for accessibility. */
export function AnnouncementBar({ messages }: { messages: readonly string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || messages.length < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000);
    return () => window.clearInterval(id);
  }, [paused, messages.length]);

  if (!messages.length) return null;
  const go = (d: number) => setIndex((i) => (i + d + messages.length) % messages.length);

  return (
    <div
      className="bg-chocolate text-sand"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role="region"
      aria-label="Announcements"
    >
      <div className="container-page flex h-9 items-center justify-between gap-2">
        <button type="button" onClick={() => go(-1)} className="grid size-7 place-items-center rounded-full hover:text-linen" aria-label="Previous announcement">
          <ChevronLeft className="size-4" />
        </button>
        <p key={index} className="animate-fade-in truncate text-center text-[0.7rem] font-semibold uppercase tracking-[0.18em]" aria-live="polite">
          {messages[index]}
        </p>
        <button type="button" onClick={() => go(1)} className="grid size-7 place-items-center rounded-full hover:text-linen" aria-label="Next announcement">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
