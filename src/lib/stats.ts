type Agg = { name: string; chapter?: string; n: number; c: number; pct: number };
export function summarize(rows: any[]) {
  const ch = new Map<string, Agg>(), tp = new Map<string, Agg>(), days = new Set<string>();
  let n = 0, c = 0;
  for (const r of rows) {
    n++; if (r.is_correct) c++;
    days.add(String(r.answered_at).slice(0, 10));
    const q = r.questions, cn = q?.chapters ? `${q.chapters.chapter_number}. ${q.chapters.title}` : "Other";
    const tn = q?.topic || "General";
    for (const [m, key, extra] of [[ch, cn, undefined], [tp, tn, cn]] as const) {
      const a = m.get(key) || { name: key, chapter: extra, n: 0, c: 0, pct: 0 };
      a.n++; if (r.is_correct) a.c++; m.set(key, a);
    }
  }
  const fin = (m: Map<string, Agg>) => [...m.values()].map((a) => ({ ...a, pct: Math.round((a.c / a.n) * 100) }));
  let streak = 0; const d = new Date();
  if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
  const byTopic = fin(tp);
  return {
    answered: n, correct: c, accuracy: n ? Math.round((c / n) * 100) : 0, streak,
    byChapter: fin(ch).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
    byTopic, weak: byTopic.filter((t) => t.n >= 2).sort((a, b) => a.pct - b.pct).slice(0, 4),
  };
}
