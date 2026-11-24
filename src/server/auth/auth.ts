import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { haveIBeenPwned } from "better-auth/plugins/haveibeenpwned";
import { db } from "../db";
import { sendEmail } from "../email";
import { layout } from "../email/templates";

const siteUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Authentication (Better Auth, users stored in our own Postgres).
 * - Email + password, scrypt-hashed by Better Auth; minimum 10 characters (NCSC guidance).
 * - Optional breached-password check (k-anonymity API — only a 5-char hash prefix leaves the server).
 * - Password reset links expire after 1 hour and revoke all other sessions.
 * - Auth endpoints are rate limited, with stricter limits on sign-in/sign-up/reset.
 * - `role` cannot be set from sign-up input (input: false) — only by an owner/admin.
 */
export const auth = betterAuth({
  baseURL: siteUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: true,
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      const { html, text } = await layout({
        title: "Reset your password",
        intro: `Hi ${user.name.split(" ")[0]}, we received a request to reset your Wild Muse password.`,
        paragraphs: ["This link expires in 1 hour. If you didn't ask for this, you can ignore this email — your password won't change."],
        cta: { label: "Choose a new password", url },
      });
      await sendEmail({ to: user.email, subject: "Reset your Wild Muse password", html, text, tags: { type: "password-reset" } });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { html, text } = await layout({
        title: "Confirm your email",
        intro: `Welcome to Wild Muse, ${user.name.split(" ")[0]}! Please confirm your email address.`,
        cta: { label: "Confirm email", url },
      });
      await sendEmail({ to: user.email, subject: "Confirm your Wild Muse account", html, text, tags: { type: "verify-email" } });
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "CUSTOMER", input: false },
      status: { type: "string", required: false, defaultValue: "ACTIVE", input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
  rateLimit: {
    enabled: process.env.AUTH_RATE_LIMIT !== "off",
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 300, max: 3 },
      "/reset-password": { window: 300, max: 5 },
    },
  },
  advanced: {
    useSecureCookies: siteUrl.startsWith("https://"),
  },
  databaseHooks: {
    session: {
      create: {
        // Suspended accounts cannot sign in.
        before: async (session) => {
          const u = await db.user.findUnique({ where: { id: session.userId }, select: { status: true } });
          if (u?.status === "SUSPENDED") return false;
        },
      },
    },
  },
  plugins: [
    ...(process.env.AUTH_CHECK_BREACHED_PASSWORDS === "true"
      ? [haveIBeenPwned({ customPasswordCompromisedMessage: "This password has appeared in a data breach. Please choose a different one." })]
      : []),
    nextCookies(), // must be last
  ],
});

export type Auth = typeof auth;
