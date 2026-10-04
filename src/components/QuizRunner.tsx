"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import Icon from "./Icon";
type Q = { id: string; chapter_id: number; topic: string; question_text: string; question_type: string; options: string[]; correct_answer: number[]; explanation: string; difficulty: string };
const same = (a: number[] = [], b: number[]) => [...a].sort().join() === [...b].sort().join();
export default function QuizRunner() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [chapters, setChapters] = useState<any[]>([]), [sel, setSel] = useState<number[]>([]);
  const [count, setCount] = useState(10), [diff, setDiff] = useState("all"), [type, setType] = useState("all"), [mode, setMode] = useState<"practice" | "exam">("practice");
  const [qs, setQs] = useState<Q[]>([]), [phase, setPhase] = useState<"setup" | "run" | "done">("setup");
  const [i, setI] = useState(0), [ans, setAns] = useState<Record<number, number[]>>({}), [shown, setShown] = useState<Record<number, boolean>>({});
  const [bm, setBm] = useState<Set<string>>(new Set()), [err, setErr] = useState(""), [start, setStart] = useState(0), [secs, setSecs] = useState(0);
  useEffect(() => {
    sb.from("chapters").select("*").order("chapter_number").then(({ data }) => setChapters(data || []));
    const p = new URLSearchParams(location.search).get("chapter"); if (p) setSel([Number(p)]);
    sb.from("bookmarks").select("question_id").then(({ data }) => setBm(new Set((data || []).map((b: any) => b.question_id))));
  }, [sb]);
  async function begin() {
    setErr("");
    let q = sb.from("questions").select("*").eq("review_status", "published");
    if (sel.length) q = q.in("chapter_id", sel);
    if (diff !== "all") q = q.eq("difficulty", diff);
    if (type !== "all") q = q.eq("question_type", type);
    const { data, error } = await q;
    if (error || !data?.length) return setErr("No questions match these filters. Try fewer filters.");
    setQs([...data].sort(() => Math.random() - 0.5).slice(0, count) as Q[]);
    setI(0); setAns({}); setShown({}); setStart(Date.now()); setPhase("run");
  }
  function pick(k: number) {
    const q = qs[i]; if (mode === "practice" && shown[i]) return;
    const multi = q.question_type === "multiple_select";
    setAns(a => { const cur = a[i] || []; return { ...a, [i]: multi ? (cur.includes(k) ? cur.filter(x => x !== k) : [...cur, k]) : [k] }; });
    if (mode === "practice" && !multi) setShown(s => ({ ...s, [i]: true }));
  }
  async function finish() {
    const unanswered = qs.filter((_, k) => !(ans[k] || []).length).length;
    if (mode === "exam" && unanswered && !confirm(`${unanswered} question(s) are unanswered. Submit anyway?`)) return;
    const t = Math.round((Date.now() - start) / 1000); setSecs(t); setPhase("done");
    const correct = qs.filter((q, k) => same(ans[k], q.correct_answer)).length;
    const { data: { user } } = await sb.auth.getUser(); if (!user) return;
    const { data: a } = await sb.from("quiz_attempts").insert({ user_id: user.id, mode, chapter_ids: sel.length ? sel : chapters.map(c => c.id), total_questions: qs.length, correct_answers: correct, score_percentage: Math.round(correct / qs.length * 100), started_at: new Date(start).toISOString(), completed_at: new Date().toISOString() }).select("id").single();
    if (a) await sb.from("quiz_responses").insert(qs.map((q, k) => ({ attempt_id: a.id, user_id: user.id, question_id: q.id, selected_answer: ans[k] || [], is_correct: same(ans[k], q.correct_answer) })));
  }
  async function toggleBm(id: string) {
    const { data: { user } } = await sb.auth.getUser(); if (!user) return;
    const n = new Set(bm);
    if (n.has(id)) { n.delete(id); await sb.from("bookmarks").delete().eq("question_id", id); } else { n.add(id); await sb.from("bookmarks").insert({ user_id: user.id, question_id: id }); }
    setBm(n);
  }
  if (phase === "setup") return (
    <div className="raised p-6 md:p-8 flex flex-col gap-6 max-w-3xl">
      <div><h3 className="font-extrabold mb-2.5">Chapters {sel.length === 0 && <span className="pill on ml-1">All</span>}</h3>
        <div className="flex flex-wrap gap-2.5">{chapters.map(c => <button key={c.id} type="button" aria-pressed={sel.includes(c.id)} className={`pill ${sel.includes(c.id) ? "on" : ""}`} onClick={() => setSel(s => s.includes(c.id) ? s.filter(x => x !== c.id) : [...s, c.id])}>{c.chapter_number}. {c.title}</button>)}</div></div>
      <div className="grid gap-4 g2c" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
        <label className="text-sm font-bold">Questions<select className="field mt-1.5" value={count} onChange={e => setCount(+e.target.value)}>{[5, 10, 20, 30, 50].map(n => <option key={n}>{n}</option>)}</select></label>
        <label className="text-sm font-bold">Difficulty<select className="field mt-1.5" value={diff} onChange={e => setDiff(e.target.value)}>{["all", "Easy", "Medium", "Hard"].map(n => <option key={n}>{n}</option>)}</select></label>
        <label className="text-sm font-bold">Type<select className="field mt-1.5" value={type} onChange={e => setType(e.target.value)}>{["all", "single_best", "multiple_select", "true_false", "calculation", "scenario"].map(n => <option key={n} value={n}>{n.replace("_", " ")}</option>)}</select></label>
      </div>
      <div className="flex gap-3">{(["practice", "exam"] as const).map(m => <button key={m} type="button" className={`btn flex-1 ${mode === m ? "pri" : ""}`} onClick={() => setMode(m)}>{m === "practice" ? "Practice (instant feedback)" : "Exam (answers at the end)"}</button>)}</div>
      {err && <p role="alert" style={{color:"var(--red)"}}>{err}</p>}
      <button className="btn pri" onClick={begin}><Icon n="target" />Start quiz</button>
    </div>);
  if (phase === "done") {
    const c = qs.filter((q, k) => same(ans[k], q.correct_answer)).length, p = Math.round(c / qs.length * 100), bad = qs.map((q, k) => ({ q, k })).filter(({ q, k }) => !same(ans[k], q.correct_answer));
    return (<div className="raised p-6 md:p-8 max-w-3xl text-center">
      <div className="ring" style={{ "--p": p } as React.CSSProperties}><div>{p}%</div></div>
      <h2 className="font-display text-2xl font-extrabold">{p >= 75 ? "Great work!" : "Good start. Keep practising."}</h2>
      <p className="mt-1" style={{color:"var(--mute)"}}>{c} correct · {qs.length - c} incorrect · {Math.floor(secs / 60)}m {secs % 60}s</p>
      <div className="text-left mt-5">{bad.length ? <h3 className="font-extrabold mb-2">Review your mistakes</h3> : <p className="text-center">No mistakes. Well done!</p>}
        {bad.map(({ q, k }) => <div key={q.id} className="inset p-4 mb-3"><b>{q.question_text}</b><p className="text-sm mt-1.5" style={{color:"var(--mute)"}}>Your answer: {(ans[k] || []).map(x => q.options[x]).join(", ") || "none"}<br />Correct: {q.correct_answer.map(x => q.options[x]).join(", ")}</p><p className="text-sm mt-1.5">{q.explanation}</p></div>)}</div>
      <div className="flex gap-3 justify-center mt-5 flex-wrap"><button className="btn pri" onClick={() => setPhase("setup")}>New quiz</button><Link href="/dashboard" className="btn">Dashboard</Link></div></div>);
  }
  const q = qs[i], cur = ans[i] || [], reveal = mode === "practice" && shown[i], multi = q.question_type === "multiple_select", ok = same(cur, q.correct_answer);
  const last = i === qs.length - 1;
  return (<div className="max-w-3xl mx-auto">
    <div className="flex items-center gap-3 mb-4"><span className="pill">{i + 1} / {qs.length}</span><div className="bar flex-1"><i style={{ width: `${(i + (reveal ? 1 : 0)) / qs.length * 100}%` }} /></div>
      <button className="sq" aria-label={bm.has(q.id) ? "Remove bookmark" : "Bookmark"} aria-pressed={bm.has(q.id)} onClick={() => toggleBm(q.id)} style={{ color: bm.has(q.id) ? "var(--orange)" : undefined }}><Icon n="mark" /></button></div>
    <div className="raised p-6 md:p-10 text-center">
      <div className="flex gap-2 justify-center flex-wrap"><span className="pill" style={{color:"var(--blue)"}}>{q.topic}</span><span className="pill">{q.difficulty}</span>{multi && <span className="pill on">Select all that apply</span>}</div>
      <h2 className="font-display font-extrabold leading-tight text-[clamp(22px,4vw,32px)] my-5">{q.question_text}</h2>
      <div className="grid gap-4 opts2 text-[16px]" style={{gridTemplateColumns:"1fr 1fr"}}>
        {q.options.map((o, k) => { const st = reveal ? (q.correct_answer.includes(k) ? "ok" : cur.includes(k) ? "no" : "") : cur.includes(k) ? "on" : ""; return <button key={k} className={`opt ${st}`} disabled={!!reveal} aria-pressed={cur.includes(k)} onClick={() => pick(k)}><span className="l">{reveal && q.correct_answer.includes(k) ? <Icon n="check" /> : reveal && cur.includes(k) ? <Icon n="x" /> : "ABCDEF"[k]}</span>{o}</button>; })}
      </div>
      {mode === "practice" && multi && !reveal && <button className="btn blu mt-5" disabled={!cur.length} onClick={() => setShown(s => ({ ...s, [i]: true }))}>Check answer</button>}
      {reveal && <div className="inset p-5 mt-6 text-left"><b className="font-display" style={{ color: ok ? "var(--green)" : "var(--red)" }}>{ok ? "Correct!" : "Not quite."}</b><p className="mt-1.5">{q.explanation}</p>
        <Link className="text-sm underline mt-2 inline-block" href={`/tutor?mode=explain&q=${encodeURIComponent(`Explain this question and why each wrong option is wrong: ${q.question_text} Options: ${q.options.join(" | ")}. Correct: ${q.correct_answer.map(x => q.options[x]).join(", ")}`)}`}>Explain this with AI</Link></div>}
    </div>
    {mode === "exam" && <div className="flex flex-wrap gap-2 mt-5 justify-center">{qs.map((_, k) => <button key={k} aria-label={`Question ${k + 1}`} className={`pill ${k === i ? "on" : ""}`} style={{ opacity: (ans[k] || []).length ? 1 : .55 }} onClick={() => setI(k)}>{k + 1}</button>)}</div>}
    <div className="flex justify-between mt-6 gap-3 flex-wrap">
      {mode === "exam" ? <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button> : <span />}
      {mode === "exam" ? (last ? <button className="btn pri" onClick={finish}>Submit exam</button> : <div className="flex gap-3"><button className="btn pri" onClick={() => setI(i + 1)}>Next <Icon n="arr" /></button><button className="btn" onClick={finish}>Submit</button></div>)
        : reveal && <button className="btn pri" onClick={() => last ? finish() : setI(i + 1)}>{last ? "See results" : "Next question"} <Icon n="arr" /></button>}
    </div></div>);
}
