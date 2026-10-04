import Link from "next/link";
import Top from "@/components/Top";
import Icon from "@/components/Icon";
import { supabaseServer } from "@/lib/supabase/server";
import { summarize } from "@/lib/stats";
export default async function Dashboard() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const [{ data: prof }, { data: rows }] = await Promise.all([
    sb.from("profiles").select("display_name").eq("id", user!.id).maybeSingle(),
    sb.from("quiz_responses").select("is_correct, answered_at, questions(topic, chapters(chapter_number, title))").order("answered_at", { ascending: false }).limit(2000),
  ]);
  const s = summarize(rows || []);
  const stats = [[s.streak, "Day streak", "flame", "var(--orange)"], [s.answered, "Answered", "check", "var(--blue)"], [`${s.accuracy}%`, "Accuracy", "target", "var(--green)"]];
  const actions = [["Practise a chapter", "/chapters", "target", "#e8742c"], ["Mixed quiz", "/quiz", "list", "#3b9ae1"], ["Review mistakes", "/progress", "x", "#d9443f"], ["Open AI tutor", "/tutor", "ai", "#8a6df0"]];
  return (<>
    <Top title={`Hi, ${prof?.display_name || "there"}`} sub={s.answered ? "Pick up where you left off." : "Start your first quiz to see your progress here."} />
    <div className="grid gap-5 mb-5" style={{gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))"}}>
      {stats.map(([v, l, i, c]) => <div key={String(l)} className="raised p-5"><b className="font-display text-3xl block">{v}</b><span className="flex gap-2 items-center text-sm" style={{color:c as string}}><Icon n={i as string}/>{l}</span></div>)}
    </div>
    <div className="grid gap-5" style={{gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))"}}>
      {actions.map(a => <Link key={a[0]} href={a[1]} className="raised p-5"><div className="ico mb-2.5" style={{background:a[3]}}><Icon n={a[2]}/></div><b className="font-display">{a[0]}</b></Link>)}
    </div>
    <h2 className="text-xl font-extrabold mt-8 mb-3.5">Revise next</h2>
    <div className="raised p-5">
      {s.weak.length ? s.weak.map(w => <div key={w.name} className="flex justify-between items-center py-3 gap-3"><div><b>{w.name}</b><br/><small style={{color:"var(--mute)"}}>{w.chapter}</small></div><span className="pill">{w.pct}%</span></div>)
        : <p style={{color:"var(--mute)"}}>Answer a few questions and your weakest topics will show up here.</p>}
    </div>
  </>);
}
