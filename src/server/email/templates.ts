import "server-only";
import { getSettings } from "../settings";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Minimal, accessible branded email layout (inline styles for email clients).
 * All interpolated values are HTML-escaped.
 */
export async function layout(opts: {
  title: string;
  intro: string;
  paragraphs?: string[];
  cta?: { label: string; url: string };
  footerNote?: string;
}) {
  const s = await getSettings();
  const paras = (opts.paragraphs ?? []).map((p) => `<p style="margin:0 0 14px;color:#6B5444;line-height:1.6">${esc(p)}</p>`).join("");
  const cta = opts.cta
    ? `<p style="margin:24px 0"><a href="${esc(opts.cta.url)}" style="background:#A84A2A;color:#fff;padding:12px 22px;text-decoration:none;font-weight:600;letter-spacing:.08em;text-transform:uppercase;font-size:13px;border-radius:2px;display:inline-block">${esc(opts.cta.label)}</a></p>`
    : "";
  const html = `<!doctype html><html lang="en-GB"><body style="margin:0;background:#F5EDE0;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#FBF7F0;border-radius:3px"><tr><td style="padding:32px">
<p style="margin:0 0 24px;font-family:Georgia,serif;letter-spacing:.22em;font-size:20px;color:#3A2417">${esc(s.business.name)}</p>
<h1 style="margin:0 0 12px;font-family:Georgia,serif;font-weight:400;font-size:26px;color:#3A2417">${esc(opts.title)}</h1>
<p style="margin:0 0 14px;color:#3A2417;line-height:1.6">${esc(opts.intro)}</p>${paras}${cta}
${opts.footerNote ? `<p style="margin:24px 0 0;font-size:12px;color:#6B5444">${esc(opts.footerNote)}</p>` : ""}
</td></tr></table>
<p style="font-size:12px;color:#6B5444;margin:16px 0 0">${esc(s.business.name)} · ${esc(s.business.address)} · ${esc(s.business.email)}</p>
</td></tr></table></body></html>`;
  const text = [opts.title, "", opts.intro, ...(opts.paragraphs ?? []), opts.cta ? `${opts.cta.label}: ${opts.cta.url}` : "", opts.footerNote ?? ""]
    .filter((l) => l !== undefined)
    .join("\n");
  return { html, text };
}
