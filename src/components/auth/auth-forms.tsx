"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { subscribeAction } from "@/app/actions/newsletter";
import { useStore } from "@/components/cart/store-provider";
import { Button } from "@/components/ui/button";
import { Checkbox, TextField } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** NCSC guidance: favour length over complexity rules. Server enforces the same minimum. */
const MIN_PASSWORD = 10;
const COMMON = ["password", "1234567890", "qwertyuiop", "letmein123", "wildmuse12"];

function passwordError(pw: string) {
  if (pw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters — three random words works well`;
  if (COMMON.some((c) => pw.toLowerCase().includes(c))) return "This password is too easy to guess";
  return undefined;
}

/** Only allow same-site relative redirects after sign-in (prevents open redirects). */
function safeNext(next: string | null, fallback = "/account") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

function friendly(code?: string, message?: string) {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email and password don't match. Please try again.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists. Try signing in or resetting your password.";
    case "PASSWORD_TOO_SHORT":
      return `Use at least ${MIN_PASSWORD} characters.`;
    case "INVALID_TOKEN":
      return "This reset link is invalid or has expired. Please request a new one.";
    default:
      return message && message.length < 140 ? message : "Something went wrong. Please try again.";
  }
}

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
      <TextField label={label} name={name} type={show ? "text" : "password"} autoComplete={autoComplete} error={error} hint={hint} maxLength={128} />
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

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-[2px] border border-danger/40 bg-danger/5 p-3 text-sm font-medium text-danger">
      {message}
    </p>
  );
}

export function LoginForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const params = useSearchParams();
  const { refresh } = useStore();
  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const email = String(f.get("email") ?? "").trim();
        const password = String(f.get("password") ?? "");
        const next = { email: EMAIL.test(email) ? undefined : "Enter a valid email address", password: password ? undefined : "Enter your password" };
        setErrors(next);
        setFormError(null);
        if (hasErrors(next)) return;
        start(async () => {
          const { error } = await authClient.signIn.email({ email, password, rememberMe: f.get("remember") === "on" });
          if (error)
            return setFormError(
              error.status === 429 ? "Too many attempts. Please wait a minute and try again." : friendly(error.code, error.message),
            );
          await refresh(); // merges guest bag + wishlist into the account
          toast.success("Welcome back");
          // Full navigation: discards any route prefetched while signed out.

          window.location.assign(safeNext(params.get("next")));
        });
      }}
    >
      <FormError message={formError} />
      <TextField label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
      <PasswordField label="Password" name="password" autoComplete="current-password" error={errors.password} />
      <div className="flex items-center justify-between">
        <Checkbox name="remember" defaultChecked label="Keep me signed in" />
        <Link href="/forgot-password" className="text-sm underline underline-offset-4">
          Forgotten your password?
        </Link>
      </div>
      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const params = useSearchParams();
  const { refresh } = useStore();
  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const name = String(f.get("name") ?? "").trim();
        const email = String(f.get("email") ?? "").trim();
        const pw = String(f.get("password") ?? "");
        const marketing = f.get("marketing") === "on";
        const next = {
          name: name ? (name.length > 100 ? "Name is too long" : undefined) : "Enter your name",
          email: EMAIL.test(email) ? undefined : "Enter a valid email address",
          password: passwordError(pw),
          confirm: pw === f.get("confirm") ? undefined : "Passwords don't match",
        };
        setErrors(next);
        setFormError(null);
        if (hasErrors(next)) return;
        start(async () => {
          const { error } = await authClient.signUp.email({ name, email, password: pw });
          if (error)
            return setFormError(
              error.status === 429 ? "Too many attempts. Please wait a minute and try again." : friendly(error.code, error.message),
            );
          if (marketing) await subscribeAction({ email, consent: true, source: "registration" });
          await refresh();
          toast.success("Account created", { description: "We've sent you an email to confirm your address." });
          // Full navigation: discards any route prefetched while signed out.

          window.location.assign(safeNext(params.get("next")));
        });
      }}
    >
      <FormError message={formError} />
      <TextField label="Full name" name="name" autoComplete="name" error={errors.name} maxLength={100} />
      <TextField label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        error={errors.password}
        hint={`At least ${MIN_PASSWORD} characters.`}
      />
      <PasswordField label="Confirm password" name="confirm" autoComplete="new-password" error={errors.confirm} />
      <Checkbox
        name="marketing"
        label="Email me about new collections and offers"
        description="Optional — we'll ask you to confirm by email. Unsubscribe any time."
      />
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
      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  if (sent)
    return (
      <p role="status" className="rounded-[2px] bg-cream p-4 text-sm">
        If an account exists for that email, we&apos;ve sent a link to reset your password. The link expires in 1 hour. Don&apos;t forget to check
        your spam folder.
      </p>
    );
  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
        if (!EMAIL.test(email)) return setError("Enter a valid email address");
        setError(undefined);
        start(async () => {
          // Same response whether or not the account exists, to prevent account enumeration.
          await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
          setSent(true);
        });
      }}
    >
      <TextField label="Email" name="email" type="email" autoComplete="email" error={error} />
      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  if (!token || params.get("error"))
    return (
      <div className="space-y-4">
        <FormError message="This reset link is invalid or has expired." />
        <Link href="/forgot-password" className="font-semibold text-terracotta underline underline-offset-4">
          Request a new link
        </Link>
      </div>
    );
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
        if (hasErrors(next)) return;
        start(async () => {
          const { error } = await authClient.resetPassword({ newPassword: pw, token });
          if (error) return setFormError(friendly(error.code, error.message));
          toast.success("Password updated — please sign in");
          router.push("/login");
        });
      }}
    >
      <FormError message={formError} />
      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        error={errors.password}
        hint={`At least ${MIN_PASSWORD} characters.`}
      />
      <PasswordField label="Confirm new password" name="confirm" autoComplete="new-password" error={errors.confirm} />
      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await authClient.signOut();
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload after an auth change so no signed-out prefetch is reused
        window.location.assign("/");
      }}
    >
      Sign out
    </button>
  );
}
