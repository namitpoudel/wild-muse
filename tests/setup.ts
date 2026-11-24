import "dotenv/config";
import { vi } from "vitest";

// Next.js runtime APIs are not available in plain Node test runs.
vi.mock("next/cache", () => ({
  cacheTag: () => {},
  cacheLife: () => {},
  revalidateTag: () => {},
  updateTag: () => {},
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));
