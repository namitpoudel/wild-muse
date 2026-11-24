"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/components/cart/store-provider";

/** While Stripe's webhook confirms the payment, refresh the page every few seconds (max ~1 minute). */
export function PaymentStatusPoller({ done }: { done: boolean }) {
  const router = useRouter();
  const { refresh } = useStore();
  const [tries, setTries] = useState(0);
  useEffect(() => {
    void refresh(); // the bag was emptied on the server
  }, [refresh]);
  useEffect(() => {
    if (done || tries >= 20) return;
    const t = setTimeout(() => {
      setTries((n) => n + 1);
      router.refresh();
    }, 3000);
    return () => clearTimeout(t);
  }, [done, tries, router]);
  return null;
}
