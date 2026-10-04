import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { summarize } from "@/lib/stats";
const MODES = ["ask", "teach", "explain", "coach"];
const DAILY_LIMIT = Number(process.env.TUTOR_DAILY_LIMIT) || 10; // per user. OpenRouter free models are capped per ACCOUNT (50/day, or 1,000/day after a one-time $10 top-up).
const SYSTEM = `You are an MRI study tutor for students using the textbook MRI in Practice. Explain clearly and accurately for a student. Separate established facts from uncertainty. Never invent textbook quotes, page numbers or references, and never claim something comes from the textbook. You are not a substitute for qualified clinical supervision: do not diagnose or give patient-specific treatment advice. Encourage the student to verify important points against their course materials. Keep answers concise.`;
const MODE_HINT: Record<string, string> = {
  ask: "Answer the student's MRI question.", teach: "Teach the topic step by step in a friendly way, with one short analogy and a quick self-check question at the end.",
  explain: "Explain the question, why the correct answer is right and why each distractor is wrong.", coach: "Use the weak-topic data to suggest a short, prioritised revision plan.",
};
export async function POST(req: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const { mode, message, history, conversationId } = body || {};
  if (!MODES.includes(mode) || typeof message !== "string" || !message.trim() || message.length > 2000) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const hist = (Array.isArray(history) ? history : []).slice(-6).filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string").map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await sb.from("ai_messages").select("id", { count: "exact", head: true }).eq("role", "user").gte("created_at", since);
  if ((count ?? 0) >= DAILY_LIMIT) return NextResponse.json({ error: "You have reached your daily tutor limit. Try again tomorrow." }, { status: 429 });
  let context = "";
  if (mode === "coach") {
    const { data } = await sb.from("quiz_responses").select("is_correct, answered_at, questions(topic, chapters(chapter_number, title))").limit(2000);
    const s = summarize(data || []);
    context = s.answered ? `Student weak topics (accuracy): ${s.weak.map(w => `${w.name} (${w.chapter}) ${w.pct}% of ${w.n}`).join("; ") || "none yet"}. Overall accuracy ${s.accuracy}% over ${s.answered} answers.` : "The student has not answered any questions yet.";
  }
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return NextResponse.json({ error: "The AI tutor is not configured yet." }, { status: 503 });
  const models = [process.env.OPENROUTER_MODEL || "deepseek/deepseek-v4-flash:free", "openrouter/free"];
  const messages = [{ role: "system", content: `${SYSTEM}\n${MODE_HINT[mode]}\n${context}` }, ...hist, { role: "user", content: message.trim() }];
  let reply = "", busy = false;
  for (const model of models) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", "X-Title": "MRI Mastery" },
        body: JSON.stringify({ model, max_tokens: 700, messages }),
      });
      if (r.status === 429) { busy = true; break; } // account-level free limit: another model will not help
      if (!r.ok) continue;
      reply = (await r.json()).choices?.[0]?.message?.content?.trim() || "";
      if (reply) break;
    } catch {}
  }
  if (busy) return NextResponse.json({ error: "The free tutor is busy or out of its daily allowance. Please try again later." }, { status: 429 });
  if (!reply) return NextResponse.json({ error: "The tutor is unavailable right now. Please try again shortly." }, { status: 502 });
  let cid = conversationId as string | undefined;
  if (!cid) { const { data } = await sb.from("ai_conversations").insert({ user_id: user.id, title: message.trim().slice(0, 60) }).select("id").single(); cid = data?.id; }
  if (cid) await sb.from("ai_messages").insert([{ conversation_id: cid, user_id: user.id, role: "user", content: message.trim() }, { conversation_id: cid, user_id: user.id, role: "assistant", content: reply }]);
  return NextResponse.json({ reply, conversationId: cid });
}
