/**
 * Runs during every production build, after migrations (see package.json → vercel-build).
 * On a brand-new database it loads the reference data (categories, delivery methods, tax classes,
 * policy pages) WITHOUT demo products. On an existing database it does nothing.
 */
import { execSync } from "node:child_process";
import { scriptClient } from "../prisma/client";

async function main() {
  const db = scriptClient();
  const methods = await db.shippingMethod.count();
  await db.$disconnect();
  if (methods > 0) {
    console.log("✔ First-run setup: database already has starter data — nothing to do.");
    return;
  }
  console.log("→ First-run setup: empty database, loading starter data (no demo products)…");
  execSync("npx prisma db seed", { stdio: "inherit", env: { ...process.env, SEED_DEMO: "false" } });
  console.log("✔ Starter data loaded.");
}

main().catch((e) => {
  console.error("✖ First-run setup failed:", e);
  process.exit(1);
});
