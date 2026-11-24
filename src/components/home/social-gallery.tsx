import { Artwork } from "@/components/brand/artwork";
import { InstagramIcon } from "@/components/brand/social-icons";
import { getSettings } from "@/server/settings";
import type { ArtworkKind, ArtworkTone } from "@/lib/catalog/types";

/**
 * Social gallery. Stage 4: tiles are curated by the admin from customer posts —
 * only with the poster's permission. Until then, illustrated placeholders invite tagging.
 */
const tiles: [ArtworkKind, ArtworkTone][] = [
  ["dress", "mustard"],
  ["bag", "terracotta"],
  ["landscape", "sand"],
  ["knit", "olive"],
  ["earrings", "chocolate"],
  ["trousers", "cream"],
];

export async function SocialGallery() {
  const { social } = await getSettings();
  return (
    <section className="py-16 md:py-24" aria-labelledby="social-heading">
      <div className="container-page mb-8 text-center">
        <p className="eyebrow mb-3 text-terracotta">#WildMuseStyle</p>
        <h2 id="social-heading" className="font-display text-display-md">
          How you wear your wild
        </h2>
        <p className="mx-auto mt-3 max-w-md text-bark">
          Tag <strong>@wildmuse</strong> on Instagram or TikTok for a chance to be featured — we always ask before sharing.
        </p>
      </div>
      <ul className="grid grid-cols-3 gap-1 md:grid-cols-6">
        {tiles.map(([kind, tone], i) => (
          <li key={i} className="group relative aspect-square overflow-hidden">
            <Artwork kind={kind} tone={tone} label="Styled outfit (placeholder for customer photo)" band={false} />
            <a
              href={social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 grid place-items-center bg-chocolate/0 text-linen opacity-0 transition-all group-hover:bg-chocolate/50 group-hover:opacity-100 focus-visible:bg-chocolate/50 focus-visible:opacity-100"
              aria-label="View on Instagram (opens in a new tab)"
            >
              <InstagramIcon className="size-7" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
