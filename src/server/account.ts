import "server-only";
import { db } from "./db";
import { requireUser, type CurrentUser } from "./auth/session";

/**
 * Customer data access. Every function resolves the signed-in user itself, so one customer
 * can never request another customer's data by passing a different id.
 */
export async function getAccountOverview() {
  const user = await requireUser("/account");
  const [orders, wishlist, reviews, sub] = await Promise.all([
    db.order.findMany({
      where: { userId: user.id, status: { not: "PENDING_PAYMENT" } },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { items: { select: { quantity: true } } },
    }),
    db.wishlistItem.count({ where: { userId: user.id } }),
    db.review.count({ where: { userId: user.id } }),
    db.newsletterSubscriber.findUnique({ where: { email: user.email }, select: { status: true } }),
  ]);
  const orderCount = await db.order.count({ where: { userId: user.id, status: { not: "PENDING_PAYMENT" } } });
  const address = await db.address.findFirst({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
  return { user, orders, orderCount, wishlist, reviews, newsletter: sub?.status ?? null, address };
}

export async function getMyOrders() {
  const user = await requireUser("/account/orders");
  return db.order.findMany({
    where: { userId: user.id, status: { not: "PENDING_PAYMENT" } },
    orderBy: { createdAt: "desc" },
    include: { items: true, shipments: { orderBy: { createdAt: "desc" } } },
  });
}

export async function getMyOrder(orderId: string) {
  const user = await requireUser(`/account/orders/${orderId}`);
  return db.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: {
      items: true,
      shipments: { include: { events: { orderBy: { occurredAt: "desc" } } } },
      refunds: true,
      returns: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getMyAddresses() {
  const user = await requireUser("/account/addresses");
  return db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
}

/** Products the customer bought (paid orders) that they haven't reviewed yet, plus their reviews. */
export async function getMyReviewData() {
  const user = await requireUser("/account/reviews");
  const [reviews, items] = await Promise.all([
    db.review.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { product: { select: { name: true, slug: true } } } }),
    db.orderItem.findMany({
      where: { order: { userId: user.id, status: { in: ["PAID", "PROCESSING", "DISPATCHED", "DELIVERED"] } } },
      select: { productId: true, productName: true, productSlug: true },
      distinct: ["productId"],
    }),
  ]);
  const reviewed = new Set(reviews.map((r) => r.productId));
  return { user, reviews, toReview: items.filter((i) => !reviewed.has(i.productId)) };
}

export async function getMyPreferences(): Promise<{ user: CurrentUser; phone: string | null; newsletter: string | null }> {
  const user = await requireUser("/account/preferences");
  const [u, sub] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { phone: true } }),
    db.newsletterSubscriber.findUnique({ where: { email: user.email }, select: { status: true } }),
  ]);
  return { user, phone: u?.phone ?? null, newsletter: sub?.status ?? null };
}

/** UK GDPR subject access / portability export. */
export async function exportMyData() {
  const user = await requireUser("/account/privacy");
  const [profile, addresses, orders, reviews, wishlist, newsletter] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, email: true, phone: true, emailVerified: true, createdAt: true } }),
    db.address.findMany({ where: { userId: user.id } }),
    db.order.findMany({ where: { userId: user.id }, include: { items: true, shipments: true, refunds: true } }),
    db.review.findMany({ where: { userId: user.id } }),
    db.wishlistItem.findMany({ where: { userId: user.id }, include: { product: { select: { name: true, slug: true } } } }),
    db.newsletterSubscriber.findUnique({
      where: { email: user.email },
      select: { status: true, consentText: true, consentAt: true, confirmedAt: true, unsubscribedAt: true },
    }),
  ]);
  return { exportedAt: new Date().toISOString(), profile, addresses, orders, reviews, wishlist, newsletter };
}
