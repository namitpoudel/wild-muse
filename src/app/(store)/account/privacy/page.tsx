import type { Metadata } from "next";
import { PrivacyActions } from "@/components/account/privacy-actions";

export const metadata: Metadata = { title: "Privacy & data" };

export default function PrivacyPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">Privacy & data</h1>
      <PrivacyActions />
    </div>
  );
}
