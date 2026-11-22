/** Recent searches, stored only in this browser (no server-side tracking). */
const KEY = "wm.searches.v1";
const MAX = 6;

export function readSearchHistory(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function pushSearchHistory(q: string): string[] {
  const term = q.trim().slice(0, 80);
  if (!term) return readSearchHistory();
  const next = [term, ...readSearchHistory().filter((x) => x.toLowerCase() !== term.toLowerCase())].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
