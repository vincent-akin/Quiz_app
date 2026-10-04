"use client";
import { useEffect, useMemo, useState } from "react";
import Top from "@/components/Top";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function Bookmarks() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [rows, setRows] = useState<any[] | null>(null);
  const load = () => sb.from("bookmarks").select("id, questions(*)").order("created_at", { ascending: false }).then(({ data }) => setRows(data || []));
  useEffect(() => { load(); }, []); // eslint-disable-line
  async function remove(id: string) { await sb.from("bookmarks").delete().eq("id", id); load(); }
  return (<><Top title="Bookmarks" sub="Review questions you saved. Tap a question to reveal the answer." />
    {rows && !rows.length && <div className="raised p-6" style={{color:"var(--mute)"}}>No bookmarks yet. Tap the bookmark icon during a quiz to save a question.</div>}
    {(rows || []).map(r => { const q = r.questions; return (
      <details key={r.id} className="raised p-5 mb-4"><summary className="cursor-pointer font-bold">{q.question_text}</summary>
        <p className="mt-3 text-sm"><b>Answer:</b> {q.correct_answer.map((x: number) => q.options[x]).join(", ")}</p><p className="mt-1.5 text-sm">{q.explanation}</p>
        <button className="btn mt-3" style={{padding:"8px 18px"}} onClick={() => remove(r.id)}>Remove bookmark</button></details>); })}</>);
}
