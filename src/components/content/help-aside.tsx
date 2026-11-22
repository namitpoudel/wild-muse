import Link from "next/link";
import { Mail } from "lucide-react";
import { siteConfig } from "@/config/site";

const links = [
  ["Delivery Information", "/pages/delivery"],
  ["Returns & Refunds", "/pages/returns"],
  ["Size Guide", "/pages/size-guide"],
  ["FAQs", "/pages/faqs"],
  ["Track My Order", "/track-order"],
  ["Contact Us", "/pages/contact"],
];

export function HelpAside({ current }: { current: string }) {
  return (
    <div className="space-y-6 lg:sticky lg:top-36">
      <nav aria-label="Help topics" className="rounded-[2px] border border-sand p-5">
        <p className="eyebrow mb-3 text-bark">Help topics</p>
        <ul className="space-y-1.5 text-sm">
          {links.map(([label, href]) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={href === current ? "page" : undefined}
                className="hover:text-terracotta aria-[current=page]:font-semibold aria-[current=page]:text-terracotta"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="rounded-[2px] bg-olive-deep p-5 text-sand">
        <p className="font-display text-xl text-linen">Still need help?</p>
        <p className="mt-1 text-sm">{siteConfig.contact.hours}</p>
        <a
          href={`mailto:${siteConfig.contact.email}`}
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-linen underline underline-offset-4"
        >
          <Mail className="size-4" aria-hidden /> {siteConfig.contact.email}
        </a>
      </div>
    </div>
  );
}
