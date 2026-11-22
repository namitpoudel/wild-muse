import Link from "next/link";
import type { ReactNode } from "react";

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;

function safeHref(href: string): string | null {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^(https:|mailto:|tel:)/i.test(href)) return href;
  return null; // blocks javascript:, data:, protocol-relative URLs
}

/** Render the tiny inline syntax (**bold**, [text](href)) as React nodes. */
export function InlineText({ text }: { text: string }) {
  const parts = text.split(TOKEN).filter(Boolean);
  return (
    <>
      {parts.map((part, i): ReactNode => {
        if (part.startsWith("**") && part.endsWith("**"))
          return (
            <strong key={i} className="font-semibold text-chocolate">
              {part.slice(2, -2)}
            </strong>
          );
        const m = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (m) {
          const href = safeHref(m[2]);
          if (!href) return m[1];
          const cls = "font-semibold text-terracotta underline underline-offset-4 hover:text-terracotta-deep";
          return href.startsWith("/") ? (
            <Link key={i} href={href} className={cls}>
              {m[1]}
            </Link>
          ) : (
            <a key={i} href={href} className={cls} {...(href.startsWith("https:") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {m[1]}
            </a>
          );
        }
        return part;
      })}
    </>
  );
}
