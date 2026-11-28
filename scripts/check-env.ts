/**
 * Pre-deploy configuration check.
 *   npm run check:env            → check the current environment (exit 1 on errors)
 * During a Vercel PRODUCTION build (`vercel-build`), errors stop the deploy, so a misconfigured
 * shop (e.g. no webhook secret, emails going nowhere) never goes live. Preview builds only warn.
 */
import "dotenv/config";
import { checkProductionEnv, isLiveDeployment } from "../src/lib/env-check";
import { applyEnvFallbacks } from "../src/lib/env-fallbacks";

applyEnvFallbacks(process.env);

const issues = checkProductionEnv(process.env);
const live = isLiveDeployment(process.env);
const forced = process.argv.includes("--strict");

for (const i of issues) console.log(`${i.level === "error" ? "✖ ERROR  " : "⚠ warning"} ${i.key}: ${i.message}`);
const errors = issues.filter((i) => i.level === "error").length;
if (!issues.length) console.log("✔ Production configuration looks complete.");

if (errors && (live || forced)) {
  console.error(`\n${errors} configuration error(s) — deploy stopped. Fix them in the hosting environment variables.`);
  process.exit(1);
}
if (errors) console.log(`\n${errors} error(s) would block a production deploy (this is not a production build, so continuing).`);
