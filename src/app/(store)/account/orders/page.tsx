import type { Metadata } from "next";
import { Package } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">Orders & tracking</h1>
      <div className="rounded-[2px] border border-sand">
        <div className="hidden grid-cols-5 gap-4 border-b border-sand px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-bark md:grid">
          <span>Order</span>
          <span>Placed</span>
          <span>Status</span>
          <span>Total</span>
          <span className="text-right">Actions</span>
        </div>
        <EmptyState icon={Package} title="No orders yet" action={<ButtonLink href="/new-arrivals">Start shopping</ButtonLink>}>
          Your orders will appear here with live status, tracking links, invoices and returns.
        </EmptyState>
      </div>
    </div>
  );
}
