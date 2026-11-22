/**
 * Information and policy pages — first-run content.
 *
 * IMPORTANT FOR THE OWNER
 * - Text in [square brackets] is a placeholder to replace with your real details.
 * - Pages marked `requiresLegalReview` are carefully researched TEMPLATES based on
 *   GOV.UK / ICO / CMA guidance, not legal advice. Have a UK solicitor review them before launch.
 * - From Stage 4 every page is editable in Admin → Content without touching code.
 */
import { siteConfig } from "@/config/site";
import type { ContentPage } from "@/lib/content/types";
import { formatPence } from "@/lib/money";

const c = siteConfig.commerce;
const contact = siteConfig.contact;
const free = formatPence(c.freeDeliveryThresholdPence);
const std = formatPence(c.standardDeliveryPence);
const exp = formatPence(c.expressDeliveryPence);
const UPDATED = "22 November 2026";

export const contentPages: ContentPage[] = [
  {
    slug: "about",
    title: "About Wild Muse",
    eyebrow: "Our story",
    description: "Wild Muse brings handmade bohemian clothing and accessories from Nepal's artisans to the UK.",
    lastUpdated: UPDATED,
    blocks: [
      {
        type: "p",
        text: `**${siteConfig.slogan}** Wild Muse is a UK fashion and lifestyle brand built on a simple idea: clothes made by hand carry something that mass-produced fashion can't.`,
      },
      {
        type: "p",
        text: "We work with small workshops, cooperatives and independent makers in Nepal — weavers, knitters, dyers, tailors and jewellery makers — and bring their work to free spirits across the UK.",
      },
      { type: "h2", text: "What we believe" },
      {
        type: "list",
        items: [
          "**Handmade, honestly described.** We tell you exactly what each piece is made from, where, and how — and we only call something handmade when it is.",
          "**Fewer, better pieces.** Small batches, made to be worn for years and repaired rather than replaced.",
          "**Fair relationships.** We aim for long-term relationships with our makers. Read how in [Ethical Sourcing](/handmade-in-nepal/ethical-sourcing).",
          "**Free-spirited style.** Bohemian, earthy and expressive — for festivals, city streets and everything in between.",
        ],
      },
      { type: "p", text: "Want to know more? Read [Our Nepal Story](/handmade-in-nepal/our-nepal-story) or [get in touch](/pages/contact)." },
    ],
  },
  {
    slug: "contact",
    title: "Contact Us",
    eyebrow: "We're here to help",
    description: "Get in touch with Wild Muse customer care.",
    lastUpdated: UPDATED,
    blocks: [
      {
        type: "p",
        text: `Email us at [${contact.email}](mailto:${contact.email}) or call [${contact.phone}](tel:${contact.phone.replace(/[^\d+]/g, "")}) — ${contact.hours}. We aim to reply to every message within one working day.`,
      },
      {
        type: "p",
        text: "For an existing order, please include your order number (it starts with **WM-**). You can also [track your order](/track-order) online.",
      },
      { type: "form", form: "contact" },
      { type: "h3", text: "Business details" },
      { type: "p", text: `${siteConfig.name} — ${contact.address}. [Company number / sole trader details to be added by the owner.]` },
    ],
  },
  {
    slug: "faqs",
    title: "Frequently Asked Questions",
    eyebrow: "Help",
    description: "Answers about delivery, returns, sizing, handmade products and payments at Wild Muse.",
    lastUpdated: UPDATED,
    blocks: [
      {
        type: "faq",
        items: [
          {
            q: "How much is UK delivery?",
            a: `UK standard delivery is ${std} and free on orders over ${free}. UK express delivery is ${exp}. See [Delivery Information](/pages/delivery).`,
          },
          { q: "Do you deliver outside the UK?", a: "Not yet. We currently deliver to UK addresses only." },
          {
            q: "How do returns work?",
            a: `You can return unworn items within ${c.returnDays} days of delivery. You also have a legal right to cancel within 14 days of receiving your order. See [Returns & Refunds](/pages/returns).`,
          },
          {
            q: "Why does my item look slightly different from the photo?",
            a: "Handmade and hand-dyed pieces vary a little in colour, pattern placement and finish. That's part of their character, and we describe these variations on each product page. If an item is faulty or not as described, you're entitled to a remedy under the Consumer Rights Act 2015.",
          },
          {
            q: "How do I find my size?",
            a: 'Each product page has a size guide, and you can see all our guides on the [Size Guide](/pages/size-guide) page. Not sure? Use "Ask about this product" and we\'ll measure the garment for you.',
          },
          {
            q: "Which payment methods do you accept?",
            a: "Visa, Mastercard, American Express, Apple Pay and Google Pay, processed securely by Stripe. We never see or store your card details.",
          },
          {
            q: "Is it safe to shop here?",
            a: "Yes. The site uses HTTPS encryption, payments are handled by Stripe (PCI DSS Level 1), and we only use your data as explained in our [Privacy Policy](/pages/privacy).",
          },
          {
            q: "Where are your products made?",
            a: "In Nepal, by small workshops, cooperatives and independent makers. The country of origin and materials are listed on every product page.",
          },
          {
            q: "How should I care for handmade pieces?",
            a: "Follow the care instructions on each product page. As a rule: wash cool, avoid tumble drying, and dry naturally-dyed and wool pieces flat and out of direct sun.",
          },
          { q: "Do you sell wholesale?", a: "Yes — please see [Wholesale Enquiries](/pages/wholesale)." },
        ],
      },
    ],
  },
  {
    slug: "delivery",
    title: "Delivery Information",
    eyebrow: "Help",
    description: `UK delivery options and costs at Wild Muse. Free UK standard delivery on orders over ${free}.`,
    lastUpdated: UPDATED,
    blocks: [
      {
        type: "table",
        caption: "UK delivery options",
        head: ["Service", "Delivery time", "Cost"],
        rows: [
          ["UK Standard (tracked)", "2–4 working days", `${std} — free over ${free}`],
          ["UK Express (tracked)", "Next working day if ordered by 1pm Mon–Thu", exp],
        ],
      },
      {
        type: "p",
        text: "Delivery times are estimates from dispatch and exclude weekends and bank holidays. Orders placed after 1pm, or at weekends, are dispatched the next working day.",
      },
      { type: "h2", text: "Tracking your order" },
      {
        type: "p",
        text: "We email you a tracking link as soon as your parcel is dispatched. You can also [track your order](/track-order) with your order number and email address.",
      },
      { type: "h2", text: "Where we deliver" },
      {
        type: "p",
        text: "We currently deliver to addresses in England, Scotland, Wales and Northern Ireland. Some Highlands and Islands postcodes may take an extra 1–2 days. We do not yet ship internationally.",
      },
      { type: "h2", text: "If something goes wrong" },
      {
        type: "p",
        text: `If your parcel hasn't arrived within the estimated time, [contact us](/pages/contact) and we'll investigate with the courier. Goods remain our responsibility until they are delivered to you.`,
      },
    ],
  },
  {
    slug: "returns",
    title: "Returns & Refunds",
    eyebrow: "Help",
    requiresLegalReview: true,
    description: "How to return an item to Wild Muse, your 14-day cancellation right and how refunds work.",
    lastUpdated: UPDATED,
    blocks: [
      { type: "h2", text: `Our ${c.returnDays}-day returns promise` },
      {
        type: "p",
        text: `If you change your mind, you can return unworn, unwashed items with their tags within **${c.returnDays} days** of delivery for a full refund of the item price.`,
      },
      { type: "h2", text: "Your legal right to cancel" },
      {
        type: "p",
        text: "Under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013 you can cancel your order for any reason within **14 days** of the day you receive the goods. You then have a further 14 days to send the goods back. This right is in addition to our returns promise and is not affected by it.",
      },
      {
        type: "p",
        text: "To cancel, email us at the address below, use the model cancellation form below, or make any other clear statement. We will refund the price of the goods and the standard delivery cost you paid (if you return the whole order) within **14 days** of receiving the goods back, or of you providing evidence of having sent them back, whichever is earlier. Refunds go to your original payment method.",
      },
      {
        type: "callout",
        tone: "info",
        text: "Owner decision required: state here whether customers pay the cost of returning goods when they change their mind. If you will charge for returns, this must be made clear to customers before they order.",
      },
      { type: "h2", text: "Faulty or incorrect items" },
      {
        type: "p",
        text: "If an item is faulty, not as described or not fit for purpose, you have rights under the Consumer Rights Act 2015, including a short-term right to reject within 30 days for a full refund. We will cover return postage. Please [contact us](/pages/contact) with your order number and a photo.",
      },
      { type: "h2", text: "How to return an item" },
      {
        type: "list",
        ordered: true,
        items: [
          `Email [${contact.email}](mailto:${contact.email}) with your order number and the items you're returning.`,
          "Pack the items securely with their tags attached.",
          "Send your parcel using a tracked service and keep your proof of postage.",
        ],
      },
      {
        type: "p",
        text: "Items that have been worn, washed or damaged (beyond what is needed to inspect them, as you would in a shop) may be refunded at a reduced amount to reflect the loss in value. Pierced earrings cannot be returned for hygiene reasons unless faulty or unopened.",
      },
      { type: "h2", text: "Model cancellation form" },
      { type: "p", text: "(Complete and return this form only if you wish to cancel the contract.)" },
      {
        type: "list",
        items: [
          `To: ${siteConfig.name}, ${contact.address}, ${contact.email}`,
          "I/We hereby give notice that I/We cancel my/our contract of sale of the following goods:",
          "Ordered on / received on:",
          "Name of consumer(s):",
          "Address of consumer(s):",
          "Signature of consumer(s) (only if this form is sent on paper):",
          "Date:",
        ],
      },
    ],
  },
  {
    slug: "size-guide",
    title: "Size Guide",
    eyebrow: "Help",
    description: "Wild Muse size guides for women's, men's and kids' clothing.",
    lastUpdated: UPDATED,
    blocks: [
      {
        type: "p",
        text: "Measure over light clothing. For bust/chest, measure around the fullest part; for waist, the narrowest part; for hips, the widest part. Handmade garments can vary by 1–2 cm — garment measurements are listed on product pages where available.",
      },
      { type: "sizeGuides" },
    ],
  },
  {
    slug: "wholesale",
    title: "Wholesale Enquiries",
    eyebrow: "Trade",
    description: "Stock Wild Muse handmade clothing and accessories in your shop.",
    lastUpdated: UPDATED,
    blocks: [
      {
        type: "p",
        text: "We work with independent boutiques, festival traders and lifestyle stores across the UK. Tell us about your business and we'll send our current trade catalogue, minimum order quantities and lead times.",
      },
      { type: "form", form: "wholesale" },
    ],
  },
  {
    slug: "review-policy",
    title: "Review Policy",
    eyebrow: "Trust",
    description: "How Wild Muse collects, moderates and displays customer reviews.",
    lastUpdated: UPDATED,
    blocks: [
      {
        type: "p",
        text: "We want reviews on Wild Muse to be genuine and useful. This policy explains how they work, in line with the Digital Markets, Competition and Consumers Act 2024 and the CMA's guidance on fake reviews.",
      },
      {
        type: "list",
        items: [
          "**Only real customers.** Reviews can only be written from a customer account. We never write, buy or commission reviews, and we do not allow anyone connected to Wild Muse to review our products.",
          '**Verified purchase.** The "Verified purchase" label appears only when our order records show the reviewer bought that product.',
          "**No incentives without disclosure.** We do not offer rewards for reviews. If we ever do, those reviews will be clearly labelled as incentivised.",
          "**Negative reviews are published.** We do not hide or suppress reviews because they are negative.",
          "**Moderation.** We check reviews before they appear and only remove those that are fake, offensive, contain personal data, are unrelated to the product, or break the law. Every review page shows an average based on all published reviews.",
          '**Reporting.** You can report any review you believe is fake or inappropriate using the "Report" link next to it.',
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    eyebrow: "Legal",
    requiresLegalReview: true,
    description: "Terms and conditions of sale for Wild Muse.",
    lastUpdated: UPDATED,
    blocks: [
      { type: "h2", text: "1. About us" },
      {
        type: "p",
        text: `This website is operated by [legal business name] trading as ${siteConfig.name} ("we", "us"). [Registered in England and Wales, company number XXXXXXXX / sole trader.] Address: ${contact.address}. Email: ${contact.email}. [VAT number, if registered.]`,
      },
      { type: "h2", text: "2. These terms" },
      {
        type: "p",
        text: "These terms apply to all orders placed on this website by consumers in the UK. Please read them, together with our [Privacy Policy](/pages/privacy) and [Returns & Refunds](/pages/returns) policy, before ordering.",
      },
      { type: "h2", text: "3. Your order and our contract" },
      {
        type: "p",
        text: "Your order is an offer to buy. A contract is formed when we email you to confirm your order has been accepted. If we cannot accept your order — for example because an item is out of stock or there is an obvious pricing error — we will tell you and will not charge you.",
      },
      { type: "h2", text: "4. Prices and payment" },
      {
        type: "p",
        text: "Prices are in pounds sterling (GBP) and include VAT where applicable. Delivery charges are shown before you pay. Payment is taken by our payment provider, Stripe, when you place your order.",
      },
      { type: "h2", text: "5. Handmade products" },
      {
        type: "p",
        text: "Our products are handmade, so colour, pattern, size and finish may vary slightly from the photographs. These natural variations are not a fault. Products must still match their description and be of satisfactory quality.",
      },
      { type: "h2", text: "6. Delivery" },
      {
        type: "p",
        text: "Delivery options, costs and estimated times are shown in [Delivery Information](/pages/delivery). Risk in the goods passes to you on delivery.",
      },
      { type: "h2", text: "7. Your right to cancel and returns" },
      {
        type: "p",
        text: "You have a legal right to cancel within 14 days of receiving your goods. Details, including the model cancellation form, are in [Returns & Refunds](/pages/returns).",
      },
      { type: "h2", text: "8. Faulty goods and your statutory rights" },
      {
        type: "p",
        text: "We are under a legal duty to supply goods that are of satisfactory quality, fit for purpose and as described. Nothing in these terms affects your statutory rights. For detailed information visit [Citizens Advice](https://www.citizensadvice.org.uk).",
      },
      { type: "h2", text: "9. Our liability" },
      {
        type: "p",
        text: "We are responsible for loss or damage you suffer that is a foreseeable result of our breaking these terms or failing to use reasonable care and skill. We do not exclude or limit liability where it would be unlawful to do so, including for death or personal injury caused by our negligence or for fraud.",
      },
      { type: "h2", text: "10. Law and disputes" },
      {
        type: "p",
        text: "These terms are governed by the law of England and Wales. If you live in Scotland or Northern Ireland you may also bring proceedings in your local courts. If you have a complaint, please [contact us](/pages/contact) first.",
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    eyebrow: "Legal",
    requiresLegalReview: true,
    description: "How Wild Muse collects, uses and protects your personal data under UK GDPR.",
    lastUpdated: UPDATED,
    blocks: [
      {
        type: "p",
        text: `[Legal business name] trading as ${siteConfig.name} is the controller of your personal data. Contact us about privacy at [${contact.email}](mailto:${contact.email}). [ICO registration number — most businesses processing personal data must pay the ICO data protection fee.]`,
      },
      { type: "h2", text: "What we collect" },
      {
        type: "list",
        items: [
          "**Identity and contact:** name, email, phone number, delivery and billing addresses.",
          "**Orders:** products bought, order history, returns and refunds.",
          "**Payment:** handled by Stripe. We receive only limited details (e.g. card type and last four digits) — never your full card number.",
          "**Account:** login email, encrypted password, wishlist, reviews and preferences.",
          "**Marketing:** your newsletter consent and email engagement.",
          "**Technical:** IP address, device and browser information, and cookie data as described in our [Cookie Policy](/pages/cookies).",
        ],
      },
      { type: "h2", text: "Why we use it and our lawful basis" },
      {
        type: "table",
        caption: "Purposes and lawful bases",
        head: ["Purpose", "Lawful basis"],
        rows: [
          ["Processing and delivering your order, returns and refunds", "Contract"],
          ["Running your account", "Contract"],
          ["Keeping accounting and tax records", "Legal obligation"],
          ["Fraud prevention and site security", "Legitimate interests"],
          ["Marketing emails", "Consent (you can withdraw at any time)"],
          ["Analytics and marketing cookies", "Consent"],
        ],
      },
      { type: "h2", text: "Who we share it with" },
      {
        type: "p",
        text: "We share data only with providers who help us run the shop, under contracts that protect your data: Stripe (payments), our hosting and database providers [Vercel, Supabase], our email provider [Resend], and delivery companies [Royal Mail / courier] for delivery. We never sell your data.",
      },
      { type: "h2", text: "International transfers" },
      {
        type: "p",
        text: "Some providers process data outside the UK (for example in the USA or EEA). Where they do, we rely on UK adequacy regulations or the International Data Transfer Agreement / Addendum to protect your data.",
      },
      { type: "h2", text: "How long we keep it" },
      {
        type: "p",
        text: "Order and invoice records are kept for 6 years from the end of the financial year they relate to, to meet HMRC requirements. Account data is kept until you delete your account. Marketing data is kept until you unsubscribe.",
      },
      { type: "h2", text: "Your rights" },
      {
        type: "p",
        text: "You can ask to access, correct, delete, restrict or port your data, and object to processing. You can manage your data and request deletion from your account. If you are unhappy, you can complain to the [Information Commissioner's Office](https://ico.org.uk/make-a-complaint/).",
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    eyebrow: "Legal",
    requiresLegalReview: true,
    description: "How Wild Muse uses cookies and how to manage your preferences.",
    lastUpdated: UPDATED,
    blocks: [
      {
        type: "p",
        text: "Cookies are small files stored on your device. We only use non-essential cookies with your consent, and you can change your choice at any time.",
      },
      {
        type: "table",
        caption: "Cookies we use",
        head: ["Category", "Purpose", "Examples", "Consent needed"],
        rows: [
          [
            "Strictly necessary",
            "Shopping bag, checkout, login, security and remembering your cookie choice",
            "wm.cart, session cookie, wm.consent",
            "No",
          ],
          ["Analytics", "Understanding how visitors use the site so we can improve it", "Google Analytics 4 (_ga)", "Yes"],
          ["Marketing", "Measuring and personalising adverts on social platforms", "Meta Pixel (_fbp), TikTok Pixel (_ttp)", "Yes"],
        ],
      },
      { type: "h2", text: "Manage your preferences" },
      { type: "cookieSettings" },
    ],
  },
];

export function getContentPage(slug: string) {
  return contentPages.find((p) => p.slug === slug) ?? null;
}
