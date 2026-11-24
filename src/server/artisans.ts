import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "./db";

export async function getPublicArtisans() {
  "use cache";
  cacheTag("artisans");
  cacheLife("hours");
  return db.artisan.findMany({
    where: { consentToPublish: true, consentDate: { not: null } },
    select: { id: true, displayName: true, craft: true, region: true, story: true, photoUrl: true },
    orderBy: { createdAt: "asc" },
  });
}
