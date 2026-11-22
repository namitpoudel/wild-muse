import type { Metadata } from "next";
import { PreferencesForm } from "@/components/account/preferences-form";

export const metadata: Metadata = { title: "Email preferences" };

export default function PreferencesPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">Email preferences</h1>
      <PreferencesForm />
    </div>
  );
}
