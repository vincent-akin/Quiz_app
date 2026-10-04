"use client";
import { useEffect, useRef, useState } from "react";
import Top from "@/components/Top";
import Icon from "@/components/Icon";
type M = { role: "user" | "assistant"; content: string };
const MODES = [["ask", "Ask AI"], ["teach", "Teach me"], ["explain", "Explain a question"], ["coach", "Revision coach"]] as const;
export default function Tutor() {
  const [mode, setMode] = useState<string>("ask"), [msgs, setMsgs] = useState<M[]>([]), [text, setText] = useState(""), [busy, setBusy] = useState(false), [conv, setConv] = useState<string>();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { const p = new URLSearchParams(location.search); if (p.get("q")) { setMode(p.get("mode") || "ask"); setText(p.get("q")!); } }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  async function send(m = mode, t = text) {
    if (m !== "coach" && !t.trim()) return;
    const msg = m === "coach" ? "What should I revise next?" : t.trim();
    const history = msgs.slice(-6); setMsgs(x => [...x, { role: "user", content: msg }]); setText(""); setBusy(true);
    try {
      const r = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: m, message: msg, history, conversationId: conv }) });
      const d = await r.json();
      setMsgs(x => [...x, { role: "assistant", content: r.ok ? d.reply : d.error || "Something went wrong. Try again." }]); if (d.conversationId) setConv(d.conversationId);
    } catch { setMsgs(x => [...x, { role: "assistant", content: "Could not reach the tutor. Check your connection and try again." }]); }
    setBusy(false);
  }
  return (<><Top title="AI Tutor" sub="Ask, learn and revise. Always check key concepts against your course materials." />
    <div className="flex flex-wrap gap-2.5 mb-4">{MODES.map(([k, l]) => <button key={k} className={`pill ${mode === k ? "on" : ""}`} aria-pressed={mode === k} onClick={() => { setMode(k); if (k === "coach") send(k); }}>{l}</button>)}</div>
    <div className="raised p-5 md:p-6 max-w-3xl">
      <div className="min-h-[240px] max-h-[55vh] overflow-y-auto pr-1">
        {!msgs.length && <div className="msg inset">Hi! Ask me about any MRI concept, or choose a mode above.</div>}
        {msgs.map((m, k) => <div key={k} className={`msg ${m.role === "user" ? "me" : "inset"}`}>{m.content}</div>)}
        {busy && <div className="msg inset" aria-live="polite">Thinking…</div>}<div ref={end} /></div>
      <form className="flex gap-2.5 mt-3" onSubmit={e => { e.preventDefault(); send(); }}>
        <input className="field" value={text} onChange={e => setText(e.target.value)} placeholder={mode === "teach" ? "Which topic should I teach?" : "Ask about MRI…"} aria-label="Message" maxLength={2000} />
        <button className="btn pri" disabled={busy} aria-label="Send"><Icon n="send" /></button></form>
      <p className="text-xs mt-3" style={{color:"var(--mute)"}}>This is a study aid, not clinical advice. It can make mistakes.</p></div></>);
}
