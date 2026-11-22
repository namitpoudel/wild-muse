import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <>
      <h1 className="mb-8 font-display text-display-lg font-light">Checkout</h1>
      <CheckoutForm />
    </>
  );
}
