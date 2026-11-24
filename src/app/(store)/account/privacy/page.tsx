import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountSkeleton } from "@/components/account/account-skeleton";
import { PrivacyActions } from "@/components/account/privacy-actions";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Privacy & data" };

export default function PrivacyPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">Privacy & data</h1>
      <Suspense fallback={<AccountSkeleton />}>
        <Gate />
      </Suspense>
    </div>
  );
}

async function Gate() {
  await requireUser("/account/privacy");
  return <PrivacyActions />;
}
