/**
 * Structured data for search engines. JSON.stringify output is escaped for "<" so
 * user-editable content can never break out of the script element (XSS-safe).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
