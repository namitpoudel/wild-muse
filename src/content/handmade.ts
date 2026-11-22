/**
 * "Handmade in Nepal" editorial section — first-run content (editable in Admin → Content from Stage 4).
 *
 * Craft descriptions reflect publicly documented Nepali techniques (see docs/01 §1.4).
 * Specific claims about Wild Muse's own makers must come from the owner's real
 * supplier relationships — no artisans, quotes or statistics are invented here.
 */
import type { ArtworkKind, ArtworkTone } from "@/lib/catalog/types";
import type { ContentPage } from "@/lib/content/types";

export interface EditorialPage extends ContentPage {
  art: { kind: ArtworkKind; tone: ArtworkTone };
  summary: string;
}

const UPDATED = "22 November 2026";

export const handmadePages: EditorialPage[] = [
  {
    slug: "our-nepal-story",
    title: "Our Nepal Story",
    eyebrow: "Handmade in Nepal",
    summary: "Why we work with makers in Nepal, and what we hope to build together.",
    description: "Why Wild Muse works with artisans and small workshops in Nepal.",
    art: { kind: "landscape", tone: "terracotta" },
    lastUpdated: UPDATED,
    blocks: [
      {
        type: "callout",
        tone: "info",
        text: "Owner: replace this introduction with your own story — how you first connected with Nepal and its makers. Personal, specific stories build the most trust.",
      },
      {
        type: "p",
        text: "Nepal has a long tradition of textile and craft skills passed down through families and communities: handloom weaving, hand-knitting, felting, hand-block printing and jewellery making among them. Much of this work happens in small workshops and homes rather than large factories.",
      },
      {
        type: "p",
        text: "Wild Muse exists to bring that craftsmanship to customers in the UK — with honest descriptions of how each piece is made, fair and lasting relationships with the people who make it, and designs that suit how free spirits actually dress.",
      },
      { type: "h2", text: "From the workshop to your wardrobe" },
      {
        type: "list",
        ordered: true,
        items: [
          "We develop designs together with our makers, using their materials and techniques.",
          "Pieces are made in small batches by hand, so every run is slightly different.",
          "Each shipment is checked, labelled with fibre content and care instructions, and imported into the UK.",
          "We photograph, describe and send every piece from the UK — usually within one working day.",
        ],
      },
    ],
  },
  {
    slug: "meet-the-artisans",
    title: "Meet the Artisans",
    eyebrow: "Handmade in Nepal",
    summary: "The weavers, knitters and makers behind every Wild Muse piece.",
    description: "Meet the artisans and workshops in Nepal who make Wild Muse clothing and accessories.",
    art: { kind: "knit", tone: "olive" },
    lastUpdated: UPDATED,
    blocks: [
      {
        type: "p",
        text: "Every Wild Muse piece is made by real people, and we want you to know who they are. Artisan profiles are published here with each maker's permission — including their craft, their workshop's location and, where they choose, their own words.",
      },
      {
        type: "callout",
        tone: "info",
        text: 'Owner: artisan profiles are added in Admin → Suppliers → Artisans (Stage 4). A profile is only shown publicly when the "consent to publish" box is ticked — please obtain written consent for names and photographs.',
      },
      { type: "h2", text: "What you'll find in each profile" },
      {
        type: "list",
        items: [
          "The maker's name (or workshop name) and region of Nepal",
          "Their craft and how they learned it",
          "The Wild Muse pieces they make",
          "Photographs from the workshop, with permission",
        ],
      },
    ],
  },
  {
    slug: "traditional-craftsmanship",
    title: "Traditional Craftsmanship",
    eyebrow: "Handmade in Nepal",
    summary: "Dhaka weaving, allo nettle fibre, hand-knitting and more.",
    description: "The traditional Nepali crafts behind Wild Muse: Dhaka weaving, allo fibre, hand-knitting, felting and block printing.",
    art: { kind: "loom", tone: "sand" },
    lastUpdated: UPDATED,
    blocks: [
      { type: "h2", text: "Dhaka weaving" },
      {
        type: "p",
        text: "Dhaka is a handwoven cloth made on wooden handlooms, with geometric patterns built up thread by thread in contrasting colours. It is strongly associated with the hill town of Palpa, where handloom weaving was established in the mid-20th century. Today genuine handloom Dhaka competes with cheaper machine-made imitations, which is why we always say clearly whether a piece is hand-loomed or Dhaka-inspired.",
      },
      { type: "h2", text: "Allo — Himalayan nettle fibre" },
      {
        type: "p",
        text: "Allo comes from the Himalayan giant nettle (Girardinia diversifolia), which grows wild in Nepal's mid-hill forests. The fibre has traditionally been harvested, processed and spun by women, then woven into a strong, textured cloth. It is often blended with cotton or wool for softness.",
      },
      { type: "h2", text: "Hand-knitting and felting" },
      {
        type: "p",
        text: "Hand-knitted woollen cardigans, hoodies and hats are among Nepal's best-known exports, often made by home-based knitters. Felting — compressing wet wool into dense fabric — is used for hats, bags and accessories.",
      },
      { type: "h2", text: "Hand-block printing and dyeing" },
      {
        type: "p",
        text: "Patterns are stamped onto cloth by hand using carved wooden blocks, and garments are dyed in small batches. Slight variations in placement and colour are the signature of the technique.",
      },
    ],
  },
  {
    slug: "our-materials",
    title: "Our Materials",
    eyebrow: "Handmade in Nepal",
    summary: "Cotton, hemp, wool, allo and the trims we use — and how to care for them.",
    description: "The natural materials used in Wild Muse clothing and accessories and how to care for them.",
    art: { kind: "scarf", tone: "chocolate" },
    lastUpdated: UPDATED,
    blocks: [
      {
        type: "p",
        text: "Every product page lists the full fibre composition, as UK textile labelling rules require. Here's what you'll find across our range.",
      },
      {
        type: "table",
        caption: "Materials we use",
        head: ["Material", "Feels like", "Care"],
        rows: [
          ["Cotton", "Breathable, soft, easy-going", "Cool machine or hand wash; line dry"],
          ["Hemp & hemp-cotton", "Textured at first, softens with every wash; hard-wearing", "30°C wash; line dry"],
          ["Wool", "Warm, springy, characterful", "Hand wash cold with wool detergent; dry flat"],
          ["Allo (nettle) blends", "Crisp, textured, natural sheen", "Hand wash cold; dry flat"],
          ["Viscose", "Fluid and drapey; used for printed and dyed pieces", "Hand wash cold; don't wring"],
        ],
      },
      {
        type: "p",
        text: 'We avoid broad claims like "eco-friendly" or "sustainable". Instead we tell you exactly what each piece is made of and how it was made, and we\'ll share certificates where we have them.',
      },
    ],
  },
  {
    slug: "ethical-sourcing",
    title: "Ethical Sourcing",
    eyebrow: "Handmade in Nepal",
    summary: "How we choose and work with our makers.",
    description: "Wild Muse's approach to sourcing from artisans and workshops in Nepal.",
    art: { kind: "bag", tone: "olive" },
    lastUpdated: UPDATED,
    blocks: [
      { type: "p", text: "These are the commitments we hold ourselves to. We'll report honestly on how we're doing, including where we fall short." },
      {
        type: "list",
        items: [
          "**Know every maker.** We record every supplier and workshop we buy from, and we visit or video-call them regularly.",
          "**Fair prices, agreed upfront.** Prices are agreed with makers before production, and we don't renegotiate after work has started.",
          "**Reasonable timelines.** We plan orders around makers' real lead times, including festivals and monsoon season, instead of demanding rush production.",
          "**No forced or child labour.** We require suppliers to confirm this, and will end relationships where it is found.",
          "**Long-term relationships.** We aim to reorder from the same makers season after season.",
        ],
      },
      {
        type: "callout",
        tone: "info",
        text: 'Owner: only publish commitments you can evidence. Avoid unverified terms such as "fair trade" (a certification mark) unless your suppliers are certified.',
      },
    ],
  },
  {
    slug: "handmade-collections",
    title: "Handmade Collections",
    eyebrow: "Handmade in Nepal",
    summary: "Shop the collections made entirely by hand.",
    description: "Shop Wild Muse collections made by hand in Nepal.",
    art: { kind: "necklace", tone: "terracotta" },
    lastUpdated: UPDATED,
    blocks: [
      {
        type: "p",
        text: "Start with [Himalayan Heritage](/collections/himalayan-heritage) for Dhaka, wool and allo pieces, or [Handmade Treasures](/collections/handmade-treasures) for jewellery and keepsakes. Every handmade product carries a **Handmade** badge.",
      },
      { type: "p", text: "Browse all [handmade women's clothing](/women/handmade-clothing) or see [what's new](/new-arrivals)." },
    ],
  },
  {
    slug: "behind-the-scenes",
    title: "Behind the Scenes",
    eyebrow: "Handmade in Nepal",
    summary: "Sampling, quality checks and the journey from Kathmandu to the UK.",
    description: "Behind the scenes at Wild Muse: from sampling in Nepal to dispatch in the UK.",
    art: { kind: "jacket", tone: "mustard" },
    lastUpdated: UPDATED,
    blocks: [
      { type: "p", text: "A look at how a Wild Muse piece goes from an idea to your doorstep." },
      {
        type: "list",
        ordered: true,
        items: [
          "**Sampling.** We agree a design and a sample with the maker, then test fit and fabric in the UK.",
          "**Production.** Small batches are made by hand — usually over several weeks.",
          "**Quality checks.** Each batch is checked for size, finish and colourfastness, and labelled with fibre content and care instructions.",
          "**Shipping and customs.** Goods travel to the UK by air or sea freight and are cleared through UK customs with the correct paperwork.",
          "**Dispatch.** Each order is packed by hand in the UK.",
        ],
      },
      { type: "callout", tone: "info", text: "Owner: add your own photographs and stories from sampling trips and the studio here." },
    ],
  },
];

export function getHandmadePage(slug: string) {
  return handmadePages.find((p) => p.slug === slug) ?? null;
}
