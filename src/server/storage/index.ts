import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * File storage adapter + upload validation.
 *
 *   STORAGE_DRIVER=local     → files under ./storage (dev / single server), served by /api/media/*
 *   STORAGE_DRIVER=supabase  → Supabase Storage (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *                              SUPABASE_PUBLIC_BUCKET, SUPABASE_PRIVATE_BUCKET)
 *
 * Security: uploads are verified by their actual bytes (not the browser's MIME type), size-limited,
 * images are re-encoded with sharp (which strips EXIF/GPS metadata and neutralises malformed files),
 * and file names are always generated server-side.
 */
type Visibility = "public" | "private";

const LOCAL_ROOT = path.join(process.cwd(), "storage");
const driver = () => process.env.STORAGE_DRIVER ?? "local";

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured");
  return { url: url.replace(/\/$/, ""), key, publicBucket: process.env.SUPABASE_PUBLIC_BUCKET ?? "media", privateBucket: process.env.SUPABASE_PRIVATE_BUCKET ?? "private" };
}

export async function putObject(key: string, body: Buffer, contentType: string, visibility: Visibility): Promise<{ key: string; url: string | null }> {
  if (!/^[a-z0-9/_.-]+$/i.test(key) || key.includes("..")) throw new Error("Invalid storage key");
  if (driver() === "supabase") {
    const s = supabase();
    const bucket = visibility === "public" ? s.publicBucket : s.privateBucket;
    const res = await fetch(`${s.url}/storage/v1/object/${bucket}/${key}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${s.key}`, "Content-Type": contentType, "x-upsert": "false", "cache-control": "31536000" },
      body: new Uint8Array(body),
    });
    if (!res.ok) throw new Error(`Supabase upload failed (${res.status})`);
    return { key, url: visibility === "public" ? `${s.url}/storage/v1/object/public/${bucket}/${key}` : null };
  }
  const file = path.join(LOCAL_ROOT, visibility, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
  return { key, url: visibility === "public" ? `/api/media/${key}` : null };
}

export async function getObject(key: string, visibility: Visibility): Promise<Buffer | null> {
  if (!/^[a-z0-9/_.-]+$/i.test(key) || key.includes("..")) return null;
  if (driver() === "supabase") {
    const s = supabase();
    const bucket = visibility === "public" ? s.publicBucket : s.privateBucket;
    const res = await fetch(`${s.url}/storage/v1/object/${bucket}/${key}`, { headers: { Authorization: `Bearer ${s.key}` } });
    return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
  }
  try {
    return await readFile(path.join(LOCAL_ROOT, visibility, key));
  } catch {
    return null;
  }
}

export async function deleteObject(key: string, visibility: Visibility) {
  if (driver() === "supabase") {
    const s = supabase();
    const bucket = visibility === "public" ? s.publicBucket : s.privateBucket;
    await fetch(`${s.url}/storage/v1/object/${bucket}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${s.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [key] }),
    });
    return;
  }
  await rm(path.join(LOCAL_ROOT, visibility, key), { force: true });
}

// ── Validation ──

export class UploadError extends Error {}

const MB = 1024 * 1024;
function sniff(buf: Buffer): string | null {
  const hex = buf.subarray(0, 12).toString("hex");
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("89504e470d0a1a0a")) return "image/png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (buf.subarray(4, 12).toString().startsWith("ftypavif")) return "image/avif";
  if (buf.subarray(4, 8).toString() === "ftyp") return "video/mp4";
  if (hex.startsWith("1a45dfa3")) return "video/webm";
  if (buf.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  return null;
}

/** Validate + re-encode an image to WebP (max 2400px, metadata stripped). */
export async function processImage(file: File, opts: { maxBytes?: number; maxEdge?: number } = {}) {
  const maxBytes = opts.maxBytes ?? 10 * MB;
  if (file.size > maxBytes) throw new UploadError(`Images must be under ${Math.round(maxBytes / MB)} MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || !type.startsWith("image/")) throw new UploadError("Please upload a JPEG, PNG, WebP or AVIF image.");
  try {
    const img = sharp(buf, { limitInputPixels: 40_000_000 }).rotate();
    const out = await img
      .resize({ width: opts.maxEdge ?? 2400, height: opts.maxEdge ?? 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    return { buffer: out.data, width: out.info.width, height: out.info.height, contentType: "image/webp", ext: "webp" };
  } catch {
    throw new UploadError("That image couldn't be read. Please try a different file.");
  }
}

export async function processVideo(file: File) {
  if (file.size > 50 * MB) throw new UploadError("Videos must be under 50 MB.");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (type !== "video/mp4" && type !== "video/webm") throw new UploadError("Please upload an MP4 or WebM video.");
  return { buffer: buf, contentType: type, ext: type === "video/mp4" ? "mp4" : "webm" };
}

export async function processDocument(file: File) {
  if (file.size > 10 * MB) throw new UploadError("Documents must be under 10 MB.");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (type !== "application/pdf" && type !== "image/jpeg" && type !== "image/png") throw new UploadError("Please upload a PDF, JPEG or PNG.");
  return { buffer: buf, contentType: type, ext: type === "application/pdf" ? "pdf" : type === "image/png" ? "png" : "jpg" };
}

export const newKey = (folder: string, ext: string) => `${folder}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;
