// Pure, dependency-free relevance helpers shared by the AI suggest/deflect
// routes. Kept here (not inline in routes) so they're unit-testable.

export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

// Score an article by how many query terms it contains; title hits weigh more.
export function scoreArticle(query: string, title: string, content: string): number {
  const terms = tokenize(query);
  const t = title.toLowerCase();
  const c = content.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (t.includes(term)) score += 3;
    if (c.includes(term)) score += 1;
  }
  return score;
}

// Human-readable byte size.
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
