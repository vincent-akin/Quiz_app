import Top from "@/components/Top";
import { supabaseServer } from "@/lib/supabase/server";
import { summarize } from "@/lib/stats";
export default async function Progress() {
  const sb = await supabaseServer();
  const [{ data: rows }, { data: att }] = await Promise.all([
    sb.from("quiz_responses").select("is_correct, answered_at, questions(topic, chapters(chapter_number, title))").limit(5000),
    sb.from("quiz_attempts").select("*").order("started_at", { ascending: false }).limit(8),
  ]);
  const s = summarize(rows || []);
  const Row = ({ n, sub, pct, c, t }: any) => <div className="py-2.5"><div className="flex justify-between gap-3 text-sm"><b>{n}{sub && <small className="font-normal" style={{color:"var(--mute)"}}> · {sub}</small>}</b><span>{c}/{t} · {pct}%</span></div><div className="bar mt-1.5"><i style={{ width: `${pct}%` }} /></div></div>;
  return (<><Top title="Progress" sub="Your performance by chapter and topic. Only you can see this." />
    <div className="grid gap-5 g2c" style={{gridTemplateColumns:"1fr 1fr"}}>
      <section className="raised p-5"><h2 className="font-extrabold text-lg mb-1">Chapters</h2>{s.byChapter.length ? s.byChapter.map(c => <Row key={c.name} n={c.name} pct={c.pct} c={c.c} t={c.n} />) : <p style={{color:"var(--mute)"}}>No answers yet.</p>}</section>
      <section className="raised p-5"><h2 className="font-extrabold text-lg mb-1">Topics, weakest first</h2>{[...s.byTopic].sort((a, b) => a.pct - b.pct).slice(0, 10).map(t => <Row key={t.name} n={t.name} sub={t.chapter} pct={t.pct} c={t.c} t={t.n} />)}</section>
    </div>
    <section className="raised p-5 mt-5"><h2 className="font-extrabold text-lg mb-2">Recent quizzes</h2>
      {(att || []).map((a: any) => <div key={a.id} className="flex justify-between py-2 text-sm"><span>{new Date(a.started_at).toLocaleDateString()} · {a.mode}</span><b>{a.correct_answers}/{a.total_questions} ({Math.round(a.score_percentage)}%)</b></div>)}
      {!att?.length && <p style={{color:"var(--mute)"}}>No quizzes yet.</p>}</section></>);
}
