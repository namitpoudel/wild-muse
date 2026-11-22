import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/brand/social-icons";
import { footerNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";

export function Footer() {
  const { contact, social } = siteConfig;
  const socials = [
    { href: social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: social.tiktok, label: "TikTok", Icon: TikTokIcon },
    { href: social.facebook, label: "Facebook", Icon: FacebookIcon },
  ];
  return (
    <footer className="bg-chocolate text-sand">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo tone="light" />
          <p className="mt-5 max-w-sm font-display text-xl italic text-linen">{siteConfig.slogan}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-sand-deep">
            Handmade bohemian clothing and accessories, made with artisans and small workshops in Nepal and shipped across the UK.
          </p>
          <ul className="mt-6 flex gap-2" aria-label="Wild Muse on social media">
            {socials.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid size-10 place-items-center rounded-full border border-sand/30 text-sand transition-colors hover:border-mustard hover:text-mustard"
                  aria-label={`${label} (opens in a new tab)`}
                >
                  <Icon className="size-4.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        {footerNav.map((group) => (
          <nav key={group.name} aria-label={group.name} className="lg:col-span-2">
            <h2 className="eyebrow mb-4 text-mustard">{group.name}</h2>
            <ul className="space-y-2.5 text-sm">
              {group.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sand transition-colors hover:text-linen hover:underline underline-offset-4">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="lg:col-span-2">
          <h2 className="eyebrow mb-4 text-mustard">Get in touch</h2>
          <ul className="space-y-3 text-sm">
            <li>
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-linen">
                <Mail className="size-4 shrink-0" aria-hidden /> {contact.email}
              </a>
            </li>
            <li>
              <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 hover:text-linen">
                <Phone className="size-4 shrink-0" aria-hidden /> {contact.phone}
              </a>
            </li>
            <li className="text-sand-deep">{contact.hours}</li>
            <li>
              <Link href="/#newsletter" className="underline underline-offset-4 hover:text-linen">
                Join the newsletter
              </Link>
            </li>
            <li>
              <CookieSettingsButton label="Cookie settings" className="font-normal text-sand hover:text-linen" />
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sand/15">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-sand-deep md:flex-row md:items-center md:justify-between">
          <p>
            © {siteConfig.name} — {contact.address}. Prices in GBP.
          </p>
          <p>Secure payments by Stripe · Visa · Mastercard · Amex · Apple Pay · Google Pay</p>
        </div>
      </div>
    </footer>
  );
}
