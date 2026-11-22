/**
 * Editable content model. Stage 4 stores these in the ContentPage table and the
 * admin edits them with a block editor; the renderer below stays the same.
 *
 * Inline text supports a deliberately tiny, XSS-safe syntax:
 *   **bold**   and   [link text](/path or https://…)
 * Nothing is ever injected as raw HTML.
 */
export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "table"; caption: string; head: string[]; rows: string[][] }
  | { type: "callout"; tone: "info" | "warning"; text: string }
  | { type: "faq"; items: { q: string; a: string }[] }
  | { type: "form"; form: "contact" | "wholesale" }
  | { type: "sizeGuides" }
  | { type: "cookieSettings" };

export interface ContentPage {
  slug: string;
  title: string;
  description: string;
  eyebrow?: string;
  /** Legal templates that must be reviewed by a qualified UK solicitor before launch. */
  requiresLegalReview?: boolean;
  lastUpdated: string;
  blocks: ContentBlock[];
}
