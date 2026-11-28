/** First-owner bootstrap and the one-click webhook secret, against the real database. */
import { afterAll, describe, expect, it } from "vitest";
import { maybePromoteFirstOwner } from "@/server/auth/bootstrap-owner";
import { db } from "@/server/db";
import { getWebhookSecret, getWebhookStatus } from "@/server/payments/webhook-setup";

const TAG = `boot-${Date.now()}`;
const email = `${TAG}@example.com`;

afterAll(async () => {
  await db.user.deleteMany({ where: { email: { startsWith: TAG } } });
  await db.siteSetting.deleteMany({ where: { key: "stripeWebhook" } });
  delete process.env.OWNER_EMAIL;
  await db.$disconnect();
});

describe("first owner from OWNER_EMAIL", () => {
  it("promotes only a verified matching account, and only when the shop has no owner", async () => {
    const u = await db.user.create({ data: { id: TAG, name: "Owner", email, emailVerified: false } });
    process.env.OWNER_EMAIL = email.toUpperCase();
    const owners = await db.user.findMany({ where: { role: "OWNER" }, select: { id: true } });
    await db.user.updateMany({ where: { id: { in: owners.map((o) => o.id) } }, data: { role: "ADMIN" } }); // simulate a fresh shop
    try {
      expect(await maybePromoteFirstOwner(u.id)).toBe(false); // not verified yet
      await db.user.update({ where: { id: u.id }, data: { emailVerified: true } });
      expect(await maybePromoteFirstOwner(u.id)).toBe(true);
      expect((await db.user.findUniqueOrThrow({ where: { id: u.id } })).role).toBe("OWNER");

      // Once an owner exists, nobody else can use it.
      const other = await db.user.create({ data: { id: `${TAG}-2`, name: "Other", email: `${TAG}-2@example.com`, emailVerified: true } });
      process.env.OWNER_EMAIL = other.email;
      expect(await maybePromoteFirstOwner(other.id)).toBe(false);
    } finally {
      await db.user.updateMany({ where: { id: { in: owners.map((o) => o.id) } }, data: { role: "OWNER" } });
    }
  });
});

describe("one-click Stripe webhook secret", () => {
  it("uses the stored secret when no env var is set, and the env var when it is", async () => {
    const saved = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    await db.siteSetting.upsert({
      where: { key: "stripeWebhook" },
      create: {
        key: "stripeWebhook",
        value: { endpointId: "we_1", secret: "whsec_stored", url: "https://x/api/webhooks/stripe", livemode: false, createdAt: "" },
      },
      update: {},
    });
    expect(await getWebhookSecret()).toBe("whsec_stored");
    expect((await getWebhookStatus()).source).toBe("auto");
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_env";
    expect(await getWebhookSecret()).toBe("whsec_env");
    if (saved) process.env.STRIPE_WEBHOOK_SECRET = saved;
    else delete process.env.STRIPE_WEBHOOK_SECRET;
  });
});
