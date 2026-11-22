"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox, TextField } from "@/components/ui/field";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/**
 * Password policy follows NCSC guidance: favour length over complexity rules.
 * Stage 4 also checks the password against known-breached lists server-side.
 */
const MIN_PASSWORD = 10;
const COMMON = ["password", "1234567890", "qwertyuiop", "letmein123", "wildmuse12"];

function passwordError(pw: string) {
  if (pw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters — three random words works well`;
  if (COMMON.some((c) => pw.toLowerCase().includes(c))) return "This password is too easy to guess";
  return undefined;
}

const PENDING = "Accounts are connected in Stage 4 — nothing was saved yet.";

function PasswordField({
  label,
  name,
  error,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  error?: string;
  autoComplete: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <TextField label={label} name={name} type={show ? "text" : "password"} autoComplete={autoComplete} error={error} hint={hint} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-[2.05rem] grid size-8 place-items-center rounded-full text-bark hover:bg-sand"
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

type Errors = Record<string, string | undefined>;
const hasErrors = (e: Errors) => Object.values(e).some(Boolean);

export function LoginForm() {
  const [errors, setErrors] = useState<Errors>({});
  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const next = {
          email: EMAIL.test(String(f.get("email"))) ? undefined : "Enter a valid email address",
          password: f.get("password") ? undefined : "Enter your password",
        };
        setErrors(next);
        if (!hasErrors(next)) toast.info(PENDING);
      }}
    >
      <TextField label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
      <PasswordField label="Password" name="password" autoComplete="current-password" error={errors.password} />
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm underline underline-offset-4">
          Forgotten your password?
        </Link>
      </div>
      <Button type="submit" size="lg" block>
        Sign in
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const [errors, setErrors] = useState<Errors>({});
  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const pw = String(f.get("password") ?? "");
        const next = {
          name: String(f.get("name") ?? "").trim() ? undefined : "Enter your name",
          email: EMAIL.test(String(f.get("email"))) ? undefined : "Enter a valid email address",
          password: passwordError(pw),
          confirm: pw === f.get("confirm") ? undefined : "Passwords don't match",
        };
        setErrors(next);
        if (!hasErrors(next)) toast.info(PENDING);
      }}
    >
      <TextField label="Full name" name="name" autoComplete="name" error={errors.name} />
      <TextField label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        error={errors.password}
        hint={`At least ${MIN_PASSWORD} characters.`}
      />
      <PasswordField label="Confirm password" name="confirm" autoComplete="new-password" error={errors.confirm} />
      <Checkbox name="marketing" label="Email me about new collections and offers" description="Optional — unsubscribe any time." />
      <p className="text-xs text-bark">
        By creating an account you agree to our{" "}
        <Link href="/pages/terms" className="underline">
          Terms
        </Link>{" "}
        and confirm you have read our{" "}
        <Link href="/pages/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
      <Button type="submit" size="lg" block>
        Create account
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <p role="status" className="rounded-[2px] bg-cream p-4 text-sm">
        If an account exists for that email, we&apos;ve sent a link to reset your password. The link expires in 1 hour. ({PENDING})
      </p>
    );
  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const email = String(new FormData(e.currentTarget).get("email"));
        if (!EMAIL.test(email)) return setError("Enter a valid email address");
        setError(undefined);
        // Same response whether or not the account exists, to prevent account enumeration.
        setSent(true);
      }}
    >
      <TextField label="Email" name="email" type="email" autoComplete="email" error={error} />
      <Button type="submit" size="lg" block>
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [errors, setErrors] = useState<Errors>({});
  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const pw = String(f.get("password") ?? "");
        const next = { password: passwordError(pw), confirm: pw === f.get("confirm") ? undefined : "Passwords don't match" };
        setErrors(next);
        if (!hasErrors(next)) toast.info(PENDING);
      }}
    >
      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        error={errors.password}
        hint={`At least ${MIN_PASSWORD} characters.`}
      />
      <PasswordField label="Confirm new password" name="confirm" autoComplete="new-password" error={errors.confirm} />
      <Button type="submit" size="lg" block>
        Update password
      </Button>
    </form>
  );
}
