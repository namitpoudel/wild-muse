-- Business-rule constraints Prisma cannot express in the schema.
-- These are the last line of defence: even a buggy code path cannot oversell stock
-- or store an invalid rating.

-- Inventory consistency
ALTER TABLE "ProductVariant" ADD CONSTRAINT "variant_stock_on_hand_nonneg" CHECK ("stockOnHand" >= 0);
ALTER TABLE "ProductVariant" ADD CONSTRAINT "variant_stock_reserved_nonneg" CHECK ("stockReserved" >= 0);
ALTER TABLE "ProductVariant" ADD CONSTRAINT "variant_reserved_le_on_hand" CHECK ("stockReserved" <= "stockOnHand");
ALTER TABLE "ProductVariant" ADD CONSTRAINT "variant_price_positive" CHECK ("pricePence" IS NULL OR "pricePence" > 0);

-- Prices
ALTER TABLE "Product" ADD CONSTRAINT "product_price_positive" CHECK ("pricePence" > 0);
ALTER TABLE "Product" ADD CONSTRAINT "product_compare_at_gt_price" CHECK ("compareAtPricePence" IS NULL OR "compareAtPricePence" > "pricePence");

-- Cart / orders
ALTER TABLE "CartItem" ADD CONSTRAINT "cart_item_qty_positive" CHECK ("quantity" > 0 AND "quantity" <= 99);
ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_qty_positive" CHECK ("quantity" > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_refunded_le_qty" CHECK ("refundedQuantity" >= 0 AND "refundedQuantity" <= "quantity");
ALTER TABLE "Order" ADD CONSTRAINT "order_totals_nonneg" CHECK ("subtotalPence" >= 0 AND "discountPence" >= 0 AND "shippingPence" >= 0 AND "taxPence" >= 0 AND "totalPence" >= 0);
ALTER TABLE "Refund" ADD CONSTRAINT "refund_amount_positive" CHECK ("amountPence" > 0);

-- Reviews
ALTER TABLE "Review" ADD CONSTRAINT "review_rating_range" CHECK ("rating" BETWEEN 1 AND 5);

-- Coupons
ALTER TABLE "Coupon" ADD CONSTRAINT "coupon_value_valid" CHECK (
  ("type" = 'PERCENT' AND "value" BETWEEN 1 AND 100) OR ("type" = 'FIXED' AND "value" > 0) OR ("type" = 'FREE_SHIPPING')
);

-- Tax
ALTER TABLE "TaxClass" ADD CONSTRAINT "tax_rate_range" CHECK ("rateBps" BETWEEN 0 AND 10000);

-- Case-insensitive unique email (Better Auth lower-cases emails, this enforces it at the DB level)
CREATE UNIQUE INDEX "user_email_lower_key" ON "user" (LOWER("email"));

-- Full-text product search (used by src/server/catalog/search.ts)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "product_search_trgm" ON "Product" USING GIN ((name || ' ' || "shortDescription" || ' ' || "fibreComposition" || ' ' || materials) gin_trgm_ops);
CREATE INDEX "product_fts" ON "Product" USING GIN (to_tsvector('english', name || ' ' || "shortDescription" || ' ' || description || ' ' || "fibreComposition" || ' ' || materials));

-- Row Level Security: the app connects with a server-only role; no anonymous/public policies exist.
-- (Defence in depth if this database is exposed through Supabase's PostgREST API.)
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
