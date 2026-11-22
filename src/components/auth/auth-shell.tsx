import { Artwork } from "@/components/brand/artwork";
import type { ArtworkKind, ArtworkTone } from "@/lib/catalog/types";

export function AuthShell({
  title,
  intro,
  children,
  footer,
  art = { kind: "dress", tone: "terracotta" },
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  art?: { kind: ArtworkKind; tone: ArtworkTone };
}) {
  return (
    <div className="container-page grid items-center gap-12 py-10 md:py-16 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-display text-display-md">{title}</h1>
        {intro && <p className="mt-2 text-bark">{intro}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 border-t border-sand pt-6 text-sm">{footer}</div>}
      </div>
      <div className="hidden aspect-[4/5] max-h-[38rem] overflow-hidden rounded-t-[999px] lg:block">
        <Artwork kind={art.kind} tone={art.tone} label="" />
      </div>
    </div>
  );
}
