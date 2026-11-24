import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountSkeleton } from "@/components/account/account-skeleton";
import { PreferencesForm } from "@/components/account/preferences-form";
import { getMyPreferences } from "@/server/account";

export const metadata: Metadata = { title: "Details & preferences" };

export default function PreferencesPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">Details & preferences</h1>
      <Suspense fallback={<AccountSkeleton />}>
        <Prefs />
      </Suspense>
    </div>
  );
}

async function Prefs() {
  const p = await getMyPreferences();
  return <PreferencesForm name={p.user.name} email={p.user.email} phone={p.phone} newsletter={p.newsletter} />;
}
