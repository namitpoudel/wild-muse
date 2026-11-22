// WCAG 2.2 contrast checker for the Wild Muse design tokens.
// Run: node scripts/check-contrast.mjs  (exits 1 if any required pair fails)
const tokens = {
  linen: "#FBF7F0",
  cream: "#F5EDE0",
  sand: "#E9DBC4",
  sandDeep: "#D9C3A1",
  terracotta: "#A84A2A",
  terracottaDeep: "#8A3A1F",
  burnt: "#C2602A",
  olive: "#5B6738",
  oliveDeep: "#434D27",
  mustard: "#C99A2E",
  chocolate: "#3A2417",
  bark: "#6B5444",
  white: "#FFFFFF",
};
const lum = (hex) => {
  const c = hex
    .slice(1)
    .match(/../g)
    .map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
// [foreground, background, minimum] — 4.5 normal text, 3 large text / UI components
const pairs = [
  ["chocolate", "linen", 4.5],
  ["chocolate", "cream", 4.5],
  ["chocolate", "sand", 4.5],
  ["bark", "linen", 4.5],
  ["bark", "cream", 4.5],
  ["terracotta", "linen", 4.5],
  ["terracotta", "cream", 4.5],
  ["white", "terracotta", 4.5],
  ["linen", "terracottaDeep", 4.5],
  ["linen", "chocolate", 4.5],
  ["sand", "chocolate", 4.5],
  ["mustard", "chocolate", 4.5],
  ["white", "olive", 4.5],
  ["linen", "oliveDeep", 4.5],
  ["olive", "linen", 4.5],
  ["chocolate", "mustard", 4.5],
  ["burnt", "linen", 3],
  ["sandDeep", "chocolate", 4.5],
];
let fail = 0;
for (const [fg, bg, min] of pairs) {
  const r = ratio(tokens[fg], tokens[bg]);
  const ok = r >= min;
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${fg.padEnd(15)} on ${bg.padEnd(15)} ${r.toFixed(2)}:1 (min ${min})`);
}
console.log(fail ? `\n${fail} pair(s) failed` : "\nAll pairs pass WCAG 2.2 AA");
process.exit(fail ? 1 : 0);
