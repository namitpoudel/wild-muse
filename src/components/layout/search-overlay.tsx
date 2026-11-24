"use client";

import * as D from "@radix-ui/react-dialog";
import { ArrowRight, Clock, Loader2, Search, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MediaImage } from "@/components/brand/artwork";
import { useConfig } from "@/components/config-provider";
import { Price } from "@/components/ui/price";
import type { Suggestion } from "@/server/catalog/search";
import { clearSearchHistory, pushSearchHistory, readSearchHistory } from "@/lib/search-history";

const EMPTY: Suggestion = { products: [], categories: [], total: 0 };

/** Header search: live suggestions (debounced), recent and popular searches. */
export function SearchOverlay({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpenState] = useState(false);
  const [q, setQ] = useState("");
  const setOpen = (o: boolean) => {
    setOpenState(o);
    if (!o) setQ(""); // start fresh (showing recent searches) next time
  };
  const [data, setData] = useState<Suggestion>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const router = useRouter();
  const POPULAR_SEARCHES = useConfig().popularSearches;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only history read when opened
    if (open) setHistory(readSearchHistory());
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset results for short queries
      setData(EMPTY);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) setData(await res.json());
      } catch {
        /* aborted or offline — keep previous suggestions */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 160);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [q]);

  function go(term: string) {
    const t = term.trim();
    if (!t) return;
    setHistory(pushSearchHistory(t));
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(t)}`);
  }

  const close = () => setOpen(false);
  const showResults = q.trim().length >= 2;

  return (
    <D.Root open={open} onOpenChange={setOpen}>
      <D.Trigger asChild>{trigger}</D.Trigger>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-chocolate/40 data-[state=open]:animate-fade-in" />
        <D.Content
          className="fixed inset-x-0 top-0 z-50 max-h-dvh overflow-y-auto bg-linen shadow-lift data-[state=open]:animate-fade-in"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <D.Title className="sr-only">Search Wild Muse</D.Title>
          <D.Description className="sr-only">Type to see matching products and categories.</D.Description>
          <div className="container-page py-5 md:py-8">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                go(q);
              }}
              className="flex items-center gap-3 border-b-2 border-chocolate pb-3"
            >
              <Search className="size-5 shrink-0" aria-hidden />
              <label htmlFor="site-search" className="sr-only">
                Search products
              </label>
              <input
                ref={inputRef}
                id="site-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search dresses, wool, silver, terracotta…"
                autoComplete="off"
                enterKeyHint="search"
                maxLength={80}
                className="min-w-0 flex-1 bg-transparent focus-visible:outline-none font-display text-2xl outline-none placeholder:text-bark/60 md:text-3xl [&::-webkit-search-cancel-button]:hidden"
              />
              {loading && <Loader2 className="size-5 animate-spin text-bark" aria-label="Searching" />}
              <D.Close className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-sand" aria-label="Close search">
                <X className="size-5" />
              </D.Close>
            </form>

            <div className="py-6" aria-live="polite">
              {!showResults ? (
                <div className="grid gap-8 md:grid-cols-2">
                  {history.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="eyebrow flex items-center gap-2 text-bark">
                          <Clock className="size-3.5" aria-hidden /> Recent searches
                        </p>
                        <button
                          type="button"
                          className="text-xs underline underline-offset-4"
                          onClick={() => {
                            clearSearchHistory();
                            setHistory([]);
                          }}
                        >
                          Clear
                        </button>
                      </div>
                      <ul className="flex flex-wrap gap-2">
                        {history.map((h) => (
                          <li key={h}>
                            <button
                              type="button"
                              onClick={() => go(h)}
                              className="rounded-full border border-sand-deep px-3.5 py-1.5 text-sm hover:border-chocolate"
                            >
                              {h}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="eyebrow mb-3 flex items-center gap-2 text-bark">
                      <TrendingUp className="size-3.5" aria-hidden /> Popular searches
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {POPULAR_SEARCHES.map((p) => (
                        <li key={p}>
                          <button type="button" onClick={() => go(p)} className="rounded-full bg-sand px-3.5 py-1.5 text-sm hover:bg-sand-deep">
                            {p}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : data.total === 0 && data.categories.length === 0 && !loading ? (
                <div>
                  <p className="text-lg">
                    No results for <strong>&ldquo;{q}&rdquo;</strong>
                  </p>
                  <p className="mt-1 text-sm text-bark">Check the spelling or try one of these:</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map((p) => (
                      <li key={p}>
                        <button type="button" onClick={() => setQ(p)} className="rounded-full bg-sand px-3.5 py-1.5 text-sm hover:bg-sand-deep">
                          {p}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="grid gap-8 md:grid-cols-[14rem_1fr]">
                  <div>
                    <p className="eyebrow mb-3 text-bark">Categories</p>
                    {data.categories.length ? (
                      <ul className="space-y-2">
                        {data.categories.map((c) => (
                          <li key={c.href}>
                            <Link href={c.href} onClick={close} className="text-sm hover:text-terracotta hover:underline underline-offset-4">
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-bark">No matching categories</p>
                    )}
                  </div>
                  <div>
                    <p className="eyebrow mb-3 text-bark">
                      Products <span className="font-normal normal-case tracking-normal">({data.total})</span>
                    </p>
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {data.products.map((p) => (
                        <li key={p.slug}>
                          <Link
                            href={`/products/${p.slug}`}
                            onClick={() => {
                              pushSearchHistory(q);
                              close();
                            }}
                            className="flex items-center gap-3 rounded-[2px] p-1.5 hover:bg-cream"
                          >
                            <div className="w-14 shrink-0 overflow-hidden rounded-[2px]">
                              <div className="aspect-[4/5]">
                                <MediaImage media={{ ...p.image, alt: "" }} />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{p.name}</p>
                              <Price pricePence={p.pricePence} compareAtPence={p.compareAtPricePence} size="sm" showSaving={false} />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {data.total > 0 && (
                      <button
                        type="button"
                        onClick={() => go(q)}
                        className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] hover:text-terracotta"
                      >
                        See all {data.total} results <ArrowRight className="size-4" aria-hidden />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
