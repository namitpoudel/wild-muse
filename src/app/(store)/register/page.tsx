import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Join Wild Muse"
      intro="Save addresses, keep your wishlist on every device and track your orders."
      art={{ kind: "knit", tone: "olive" }}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-terracotta underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
