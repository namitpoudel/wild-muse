import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      intro="Sign in to track orders, save your wishlist across devices and check out faster."
      footer={
        <>
          New to Wild Muse?{" "}
          <Link href="/register" className="font-semibold text-terracotta underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
