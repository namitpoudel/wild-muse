import type { ArtworkKind, ArtworkTone, MediaAsset } from "@/lib/catalog/types";
import { cn, hashString } from "@/lib/utils";

/**
 * Branded placeholder artwork.
 *
 * Wild Muse has no product photography yet, so instead of stock photos (licence risk)
 * or grey boxes we render lightweight, deterministic SVG illustrations in the brand
 * palette, inspired by Dhaka weaving geometry. Each is < 3 KB, needs no network request
 * and is replaced automatically as soon as the owner uploads a real image (`src`).
 */

const TONES: Record<ArtworkTone, { bg: string; mid: string; fg: string; accent: string }> = {
  terracotta: { bg: "#B65B3C", mid: "#A84A2A", fg: "#F5EDE0", accent: "#E2B65A" },
  olive: { bg: "#6C7A46", mid: "#5B6738", fg: "#F5EDE0", accent: "#D9C3A1" },
  sand: { bg: "#E6D5B8", mid: "#D9C3A1", fg: "#A84A2A", accent: "#5B6738" },
  chocolate: { bg: "#4B3123", mid: "#3A2417", fg: "#E9DBC4", accent: "#C99A2E" },
  mustard: { bg: "#D2A747", mid: "#C99A2E", fg: "#3A2417", accent: "#FBF7F0" },
  cream: { bg: "#F1E7D6", mid: "#E9DBC4", fg: "#5B6738", accent: "#A84A2A" },
};

function Silhouette({ kind, fg, accent }: { kind: ArtworkKind; fg: string; accent: string }) {
  switch (kind) {
    case "dress":
      return (
        <g>
          <path d="M172 95 L180 58 M228 95 L220 58" stroke={fg} strokeWidth="5" strokeLinecap="round" />
          <path d="M170 95 C182 108 218 108 230 95 L237 140 L226 172 L302 432 Q200 452 98 432 L174 172 L163 140 Z" fill={fg} />
          <path d="M160 230 L240 230 M140 300 L260 300 M118 370 L282 370" stroke={accent} strokeWidth="6" strokeDasharray="10 8" />
        </g>
      );
    case "top":
    case "shirt":
      return (
        <g>
          <path d="M150 110 L182 94 Q200 116 218 94 L250 110 L302 178 L273 196 L253 166 L255 336 Q200 346 145 336 L147 166 L127 196 L98 178 Z" fill={fg} />
          {kind === "shirt" ? (
            <g fill={accent}>
              {[150, 185, 220, 255, 290].map((y) => (
                <circle key={y} cx="200" cy={y} r="4.5" />
              ))}
            </g>
          ) : (
            <path d="M178 116 Q200 150 222 116" stroke={accent} strokeWidth="5" fill="none" strokeDasharray="6 5" />
          )}
        </g>
      );
    case "trousers":
      return (
        <g>
          <path d="M140 90 L260 90 L268 150 Q288 300 262 432 L222 432 L204 192 L196 192 L178 432 L138 432 Q112 300 132 150 Z" fill={fg} />
          <path d="M138 108 L262 108" stroke={accent} strokeWidth="7" strokeDasharray="4 4" />
          <path d="M140 410 L178 410 M222 410 L262 410" stroke={accent} strokeWidth="6" />
        </g>
      );
    case "jacket":
      return (
        <g>
          <path d="M145 100 L182 88 L200 142 L218 88 L255 100 L302 222 L302 332 L273 337 L263 212 L263 378 L137 378 L137 212 L127 337 L98 332 L98 222 Z" fill={fg} />
          <path d="M137 212 L263 212 M137 290 L263 290" stroke={accent} strokeWidth="4" strokeDasharray="14 6" />
          <path d="M200 142 L200 378" stroke={accent} strokeWidth="3" />
        </g>
      );
    case "knit":
      return (
        <g>
          <path d="M140 105 L178 92 Q200 110 222 92 L260 105 L306 302 L277 310 L259 202 L259 352 L141 352 L141 202 L123 310 L94 302 Z" fill={fg} />
          <path d="M141 330 L259 330 M141 340 L259 340 M150 150 L250 150 M150 165 L250 165" stroke={accent} strokeWidth="3" />
          <path d="M155 200 L170 185 L185 200 L200 185 L215 200 L230 185 L245 200" stroke={accent} strokeWidth="4" fill="none" />
        </g>
      );
    case "bag":
      return (
        <g>
          <path d="M152 214 Q200 52 248 214" stroke={fg} strokeWidth="9" fill="none" />
          <rect x="128" y="200" width="144" height="176" rx="14" fill={fg} />
          <path d="M128 200 L272 200 L272 262 Q200 304 128 262 Z" fill={accent} opacity="0.9" />
          <circle cx="200" cy="276" r="7" fill={fg} />
        </g>
      );
    case "necklace": {
      const beads = Array.from({ length: 23 }, (_, i) => {
        const t = Math.PI * (0.12 + (0.76 * i) / 22);
        return { x: 200 + 118 * Math.cos(t), y: 120 + 190 * Math.sin(t), i };
      });
      return (
        <g>
          {beads.map((b) => (
            <circle key={b.i} cx={b.x.toFixed(1)} cy={b.y.toFixed(1)} r={b.i % 3 === 0 ? 10 : 7.5} fill={b.i % 3 === 0 ? accent : fg} />
          ))}
          <path d="M200 312 L222 352 L200 392 L178 352 Z" fill={accent} />
        </g>
      );
    }
    case "earrings":
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M150 170 L150 195 M250 170 L250 195" stroke={fg} strokeWidth="4" />
          <circle cx="150" cy="262" r="62" stroke={fg} strokeWidth="9" />
          <circle cx="250" cy="262" r="62" stroke={fg} strokeWidth="9" />
          <circle cx="150" cy="262" r="62" stroke={accent} strokeWidth="2" strokeDasharray="3 9" />
          <circle cx="250" cy="262" r="62" stroke={accent} strokeWidth="2" strokeDasharray="3 9" />
        </g>
      );
    case "scarf":
      return (
        <g>
          <path d="M150 80 L250 80 L264 418 L232 440 L214 150 L186 150 L168 440 L136 418 Z" fill={fg} />
          <path d="M150 120 L250 120 M144 220 L176 220 M224 220 L256 220 M140 320 L172 320 M228 320 L260 320" stroke={accent} strokeWidth="6" />
          <path d="M140 430 L140 458 M150 436 L150 462 M160 440 L160 466 M236 440 L236 466 M246 436 L246 462 M256 430 L256 458" stroke={fg} strokeWidth="3" />
        </g>
      );
    case "hat":
      return (
        <g>
          <ellipse cx="200" cy="292" rx="150" ry="40" fill={fg} />
          <path d="M128 292 Q128 168 200 162 Q272 168 272 292 Z" fill={fg} />
          <path d="M132 262 Q200 276 268 262" stroke={accent} strokeWidth="12" fill="none" />
        </g>
      );
    case "landscape":
      return (
        <g>
          <circle cx="270" cy="150" r="46" fill={accent} />
          <path d="M-10 360 L90 210 L150 290 L230 150 L330 300 L410 220 L410 520 L-10 520 Z" fill={fg} opacity="0.95" />
          <path d="M230 150 L262 198 L244 192 L230 210 L214 190 L200 196 Z" fill={accent} opacity="0.85" />
          <path d="M-10 420 L120 330 L220 400 L300 350 L410 410 L410 520 L-10 520 Z" fill={accent} opacity="0.35" />
        </g>
      );
    case "loom":
      return (
        <g>
          {Array.from({ length: 22 }, (_, i) => (
            <path key={i} d={`M${53 + i * 14} 60 L${53 + i * 14} 400`} stroke={fg} strokeWidth="2" opacity="0.7" />
          ))}
          <path d="M200 120 L290 230 L200 340 L110 230 Z" fill={fg} />
          <path d="M200 160 L257 230 L200 300 L143 230 Z" fill={accent} />
          <path d="M200 200 L225 230 L200 260 L175 230 Z" fill={fg} />
          <rect x="40" y="48" width="320" height="14" fill={fg} />
          <rect x="40" y="398" width="320" height="14" fill={fg} />
        </g>
      );
  }
}

/** Dhaka-inspired woven band of alternating triangles. */
function DhakaBand({ y, colours, offset }: { y: number; colours: string[]; offset: number }) {
  const w = 26;
  return (
    <g>
      {Array.from({ length: 18 }, (_, i) => {
        const x = i * w - offset;
        return (
          <g key={i}>
            <path d={`M${x} ${y + 24} L${x + w / 2} ${y} L${x + w} ${y + 24} Z`} fill={colours[i % colours.length]} />
            <path d={`M${x + w / 2} ${y} L${x + w} ${y + 24} L${x + w * 1.5} ${y} Z`} fill={colours[(i + 1) % colours.length]} opacity="0.55" />
          </g>
        );
      })}
    </g>
  );
}

export function Artwork({
  kind,
  tone,
  label,
  className,
  band = true,
}: {
  kind: ArtworkKind;
  tone: ArtworkTone;
  label: string;
  className?: string;
  band?: boolean;
}) {
  const t = TONES[tone];
  const seed = hashString(`${kind}:${tone}:${label}`);
  const offset = seed % 26;
  const sunX = 70 + (seed % 260);
  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={cn("block h-full w-full", className)}
    >
      <rect width="400" height="500" fill={t.bg} />
      <rect y="300" width="400" height="200" fill={t.mid} opacity="0.55" />
      {kind !== "landscape" && kind !== "loom" && <circle cx={sunX} cy={70 + (seed % 40)} r="34" fill={t.accent} opacity="0.35" />}
      <Silhouette kind={kind} fg={t.fg} accent={t.accent} />
      {band && <DhakaBand y={462} colours={[t.fg, t.accent, t.mid]} offset={offset} />}
    </svg>
  );
}

/** Renders the uploaded image when present, otherwise branded artwork. */
export function MediaImage({
  media,
  className,
  sizes,
  priority,
}: {
  media: MediaAsset;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (media.src) {
    // Real photography path (Stage 4 uploads). next/image handles responsive sizes + lazy loading.
    // eslint-disable-next-line @next/next/no-img-element -- replaced by next/image once a remote image domain is configured in Stage 4
    return <img src={media.src} alt={media.alt} sizes={sizes} loading={priority ? "eager" : "lazy"} className={cn("h-full w-full object-cover", className)} />;
  }
  return <Artwork kind={media.kind} tone={media.tone} label={media.alt} className={className} />;
}
