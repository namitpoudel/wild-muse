import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" intro="Your reset link is valid for 1 hour." art={{ kind: "scarf", tone: "sand" }}>
      <ResetPasswordForm />
    </AuthShell>
  );
}
