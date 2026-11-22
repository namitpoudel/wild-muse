import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { TrackOrderForm } from "@/components/account/track-order-form";

export const metadata: Metadata = { title: "Track my order", description: "Track your Wild Muse order with your order number and email." };

export default function TrackOrderPage() {
  return (
    <AuthShell
      title="Track my order"
      intro="Enter your order number and email to see the latest status."
      art={{ kind: "bag", tone: "mustard" }}
      footer={
        <>
          Have an account?{" "}
          <Link href="/account/orders" className="font-semibold text-terracotta underline underline-offset-4">
            See all your orders
          </Link>
        </>
      }
    >
      <TrackOrderForm />
    </AuthShell>
  );
}
