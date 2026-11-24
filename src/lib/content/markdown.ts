/**
 * Simple, owner-friendly text format ⇄ content blocks (used by Admin → Content).
 *
 *   ## Heading            ### Sub-heading
 *   - bullet              1. numbered
 *   > callout text        > [!warning] warning callout
 *   Table: Caption        (then pipe rows: | A | B |  — first row is the header)
 *   [[faq]] Q: … / A: … [[/faq]]
 *   [[form:contact]]  [[form:wholesale]]  [[size-guides]]  [[cookie-settings]]
 *   Paragraphs are separated by a blank line. Inline: **bold** and [link](/path)
 */
import type { ContentBlock } from "./types";

export function blocksToText(blocks: ContentBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "p":
          return b.text;
        case "h2":
          return `## ${b.text}`;
        case "h3":
          return `### ${b.text}`;
        case "list":
          return b.items.map((it, i) => (b.ordered ? `${i + 1}. ${it}` : `- ${it}`)).join("\n");
        case "callout":
          return `> ${b.tone === "warning" ? "[!warning] " : ""}${b.text}`;
        case "table":
          return [`Table: ${b.caption}`, `| ${b.head.join(" | ")} |`, ...b.rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
        case "faq":
          return ["[[faq]]", ...b.items.flatMap((f) => [`Q: ${f.q}`, `A: ${f.a}`]), "[[/faq]]"].join("\n");
        case "form":
          return `[[form:${b.form}]]`;
        case "sizeGuides":
          return "[[size-guides]]";
        case "cookieSettings":
          return "[[cookie-settings]]";
      }
    })
    .join("\n\n");
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

export function textToBlocks(text: string): ContentBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: ContentBlock[] = [];
  let i = 0;
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push({ type: "p", text: para.join(" ").trim() });
    para = [];
  };
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) {
      flush();
      i++;
      continue;
    }
    if (line === "[[faq]]") {
      flush();
      const items: { q: string; a: string }[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "[[/faq]]") {
        const l = lines[i].trim();
        if (l.startsWith("Q:")) items.push({ q: l.slice(2).trim(), a: "" });
        else if (l.startsWith("A:") && items.length) items[items.length - 1].a = l.slice(2).trim();
        else if (l && items.length) items[items.length - 1].a += ` ${l}`;
        i++;
      }
      out.push({ type: "faq", items });
      i++;
      continue;
    }
    const special = line.match(/^\[\[(form:(contact|wholesale)|size-guides|cookie-settings)\]\]$/);
    if (special) {
      flush();
      if (special[2]) out.push({ type: "form", form: special[2] as "contact" | "wholesale" });
      else out.push(special[1] === "size-guides" ? { type: "sizeGuides" } : { type: "cookieSettings" });
      i++;
      continue;
    }
    if (line.startsWith("### ") || line.startsWith("## ")) {
      flush();
      out.push({ type: line.startsWith("### ") ? "h3" : "h2", text: line.replace(/^#+\s*/, "") });
      i++;
      continue;
    }
    if (line.startsWith(">")) {
      flush();
      let t = line.replace(/^>\s?/, "");
      const warning = t.startsWith("[!warning]");
      t = t.replace(/^\[!(warning|info)\]\s*/, "");
      out.push({ type: "callout", tone: warning ? "warning" : "info", text: t });
      i++;
      continue;
    }
    if (/^(- |\* |\d+\. )/.test(line)) {
      flush();
      const ordered = /^\d+\. /.test(line);
      const items: string[] = [];
      while (i < lines.length && /^(- |\* |\d+\. )/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^(- |\* |\d+\. )/, ""));
        i++;
      }
      out.push({ type: "list", items, ...(ordered ? { ordered: true } : {}) });
      continue;
    }
    if (line.startsWith("Table:") || line.startsWith("|")) {
      flush();
      const caption = line.startsWith("Table:") ? line.slice(6).trim() : "";
      if (line.startsWith("Table:")) i++;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const r = cells(lines[i]);
        if (!r.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(r);
        i++;
      }
      if (rows.length) out.push({ type: "table", caption, head: rows[0], rows: rows.slice(1) });
      continue;
    }
    para.push(line);
    i++;
  }
  flush();
  return out;
}
