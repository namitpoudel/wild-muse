import { Hand, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { getPublicConfig } from "@/server/public-config";
import { formatPence } from "@/lib/money";

export async function ValueStrip() {
  const config = await getPublicConfig();
  const items = [
    config.freeDeliveryThresholdPence !== null
      ? { Icon: Truck, title: `Free UK delivery over ${formatPence(config.freeDeliveryThresholdPence)}`, text: "Tracked options available" }
      : { Icon: Truck, title: "Tracked UK delivery", text: "Standard and express options" },
    { Icon: RotateCcw, title: `${config.returnDays}-day returns`, text: "Simple, no-quibble returns" },
    { Icon: Hand, title: "Handmade in Nepal", text: "Small batches, real artisans" },
    { Icon: ShieldCheck, title: "Secure checkout", text: "Cards, Apple Pay & Google Pay" },
  ];
  return (
    <section aria-label="Why shop with Wild Muse" className="border-y border-sand bg-linen">
      <ul className="container-page grid grid-cols-2 gap-x-4 gap-y-6 py-6 lg:grid-cols-4">
        {items.map(({ Icon, title, text }) => (
          <li key={title} className="flex items-start gap-3">
            <Icon className="mt-0.5 size-5 shrink-0 text-terracotta" strokeWidth={1.6} aria-hidden />
            <div>
              <p className="text-sm font-semibold leading-snug">{title}</p>
              <p className="text-xs text-bark">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
