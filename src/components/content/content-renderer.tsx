import { Info, TriangleAlert } from "lucide-react";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";
import { Accordion } from "@/components/ui/accordion";
import { sizeGuides } from "@/config/size-guides";
import { InlineText } from "@/lib/content/rich-text";
import type { ContentBlock } from "@/lib/content/types";
import { EnquiryForm } from "./enquiry-form";
import { JsonLd } from "@/components/seo/json-ld";

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <div className="my-6 overflow-x-auto">
      <table className={`w-full text-sm ${head.length > 3 ? "min-w-[34rem]" : ""}`}>
        <caption className="mb-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-bark">{caption}</caption>
        <thead>
          <tr className="border-b border-chocolate text-left">
            {head.map((h) => (
              <th key={h} scope="col" className="py-2 pr-4 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-sand align-top">
              {r.map((cell, j) => (
                <td key={j} className="py-2.5 pr-4 text-bark first:font-medium first:text-chocolate">
                  <InlineText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ContentRenderer({ blocks }: { blocks: ContentBlock[] }) {
  // Heading level in force before each block (the page title is the h1).
  const levelBefore: number[] = [];
  let level = 1;
  for (const b of blocks) {
    levelBefore.push(level);
    if (b.type === "h2") level = 2;
    else if (b.type === "h3") level = 3;
  }
  return (
    <div className="max-w-3xl text-[1.02rem] leading-relaxed text-bark">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return (
              <p key={i} className="my-4">
                <InlineText text={b.text} />
              </p>
            );
          case "h2":
            return (
              <h2 key={i} className="mb-3 mt-10 font-display text-2xl text-chocolate md:text-3xl">
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="mb-2 mt-8 text-lg font-semibold text-chocolate">
                {b.text}
              </h3>
            );
          case "list": {
            const L = b.ordered ? "ol" : "ul";
            return (
              <L key={i} className={`my-4 space-y-2 pl-6 ${b.ordered ? "list-decimal" : "list-disc"} marker:text-terracotta`}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    <InlineText text={it} />
                  </li>
                ))}
              </L>
            );
          }
          case "table":
            return <Table key={i} caption={b.caption} head={b.head} rows={b.rows} />;
          case "callout": {
            const Icon = b.tone === "warning" ? TriangleAlert : Info;
            return (
              <p key={i} className="my-6 flex gap-3 rounded-[2px] border border-mustard/50 bg-mustard/10 p-4 text-sm text-chocolate">
                <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <InlineText text={b.text} />
                </span>
              </p>
            );
          }
          case "faq":
            return (
              <div key={i} className="my-4">
                <JsonLd
                  data={{
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: b.items.map((f) => ({
                      "@type": "Question",
                      name: f.q,
                      acceptedAnswer: { "@type": "Answer", text: f.a.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "") },
                    })),
                  }}
                />
                <Accordion
                  headingLevel={Math.min(levelBefore[i] + 1, 4) as 2 | 3 | 4}
                  items={b.items.map((f, j) => ({
                    id: `faq-${j}`,
                    title: <span className="normal-case tracking-normal text-base font-semibold">{f.q}</span>,
                    content: <InlineText text={f.a} />,
                  }))}
                />
              </div>
            );
          case "form":
            return <EnquiryForm key={i} kind={b.form} />;
          case "sizeGuides":
            return (
              <div key={i}>
                {Object.entries(sizeGuides)
                  .filter(([, g]) => g.rows.length)
                  .map(([key, g]) => (
                    <section key={key} aria-label={g.title}>
                      <h2 className="mb-1 mt-10 font-display text-2xl text-chocolate">{g.title}</h2>
                      <p className="text-sm">{g.note}</p>
                      <Table caption={`${g.title} (cm)`} head={g.columns} rows={g.rows} />
                    </section>
                  ))}
              </div>
            );
          case "cookieSettings":
            return <CookieSettingsButton key={i} />;
        }
      })}
    </div>
  );
}
