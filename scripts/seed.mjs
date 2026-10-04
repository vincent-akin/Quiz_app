// Usage:
//   npm run seed -- --dry        validate and summarise only (no database writes)
//   npm run seed                 import; questions without a "status" are saved as drafts (hidden in the app)
//   npm run seed -- --publish    import; questions without a "status" are published (only do this after review)
import { readFileSync, readdirSync } from "node:fs";
const DRY = process.argv.includes("--dry"), PUBLISH = process.argv.includes("--publish");
const DIR = process.env.QUESTIONS_DIR || "data/questions";

// Stable per-question shuffle so the correct answer is not always option A, and stays the same on re-seed.
function rng(str) { let h = 1779033703 ^ str.length; for (const c of str) { h = Math.imul(h ^ c.charCodeAt(0), 3432918353); h = (h << 13) | (h >>> 19); } return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
function shuffle(q, answerIdx) {
  if (q.type === "true_false") return { options: q.options, answer: answerIdx };
  const order = q.options.map((_, i) => i), r = rng(q.id);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return { options: order.map((i) => q.options[i]), answer: answerIdx.map((a) => order.indexOf(a)).sort((a, b) => a - b) };
}
// Accepts answer as [0,2], 0, "Tesla" (option text), "B" (letter) or ["Tesla","Hertz"].
function toIndexes(q, where) {
  const raw = Array.isArray(q.answer) ? q.answer : [q.answer];
  return raw.map((a) => {
    if (Number.isInteger(a)) return a;
    const i = q.options.findIndex((o) => String(o).trim() === String(a).trim());
    if (i >= 0) return i;
    if (typeof a === "string" && /^[A-F]$/i.test(a.trim())) return a.trim().toUpperCase().charCodeAt(0) - 65;
    throw new Error(`${where}: answer ${JSON.stringify(a)} does not match any option`);
  });
}


// Maps any incoming type to the five the database allows. Multiple correct answers force multiple_select.
const TYPES = ["single_best", "multiple_select", "true_false", "calculation", "scenario"];
const typeMap = {};
function normType(q, idx) {
  const t = String(q.type || "").toLowerCase().replace(/[\s-]+/g, "_");
  let out;
  if (idx.length > 1) out = "multiple_select";
  else if (q.options.length === 2 && q.options.every((o) => /^(true|false)$/i.test(String(o).trim()))) out = "true_false";
  else if (TYPES.includes(t)) out = t;
  else if (/calc|numer/.test(t)) out = "calculation";
  else if (/scen|clinic|case|appl|technical/.test(t)) out = "scenario";
  else out = "single_best";
  const k = `${q.type ?? "(none)"} -> ${out}`; typeMap[k] = (typeMap[k] || 0) + 1;
  return out;
}

const normDiff = (d) => { const x = String(d ?? "").toLowerCase(); return /^e/.test(x) ? "Easy" : /^h|diff|adv/.test(x) ? "Hard" : "Medium"; };
const rows = [], ids = new Set(), stats = { noStatus: 0, noDifficulty: 0 };
for (const f of readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
  const list = JSON.parse(readFileSync(`${DIR}/${f}`, "utf8"));
  if (!Array.isArray(list)) throw new Error(`${f}: expected an array of questions`);
  for (const q of list) {
    const where = `${f} (${q.id ?? "no id"})`;
    if (!q.id || ids.has(q.id)) throw new Error(`${where}: missing or duplicate id`); ids.add(q.id);
    if (!Array.isArray(q.options) || q.options.length < 2) throw new Error(`${where}: options must be an array of 2+ items`);
    if (!q.explanation || !q.text || !q.topic || !q.chapter) throw new Error(`${where}: needs text, topic, chapter and explanation`);
    if (!Number.isInteger(q.chapter) || q.chapter < 1 || q.chapter > 7) throw new Error(`${where}: chapter must be a number from 1 to 7, got ${JSON.stringify(q.chapter)}`);
    const idx = toIndexes(q, where);
    if (!idx.length || idx.some((a) => a < 0 || a >= q.options.length)) throw new Error(`${where}: answer index out of range`);
    if (!q.status) stats.noStatus++; if (!q.difficulty) stats.noDifficulty++;
    const type = normType(q, idx), s = shuffle({ ...q, type }, idx);
    rows.push({ id: q.id, chapter_id: q.chapter, topic: q.topic, question_text: q.text, question_type: type, options: s.options, correct_answer: s.answer, explanation: q.explanation, difficulty: normDiff(q.difficulty), learning_objective: q.learning_objective ?? null, source_note: q.source_note ?? "General MRI knowledge. Not yet verified against the textbook.", review_status: ["draft", "reviewed", "published"].includes(q.status) ? q.status : PUBLISH ? "published" : "draft", updated_at: new Date().toISOString() });
  }
}
console.log(`Validated ${rows.length} questions. Without status: ${stats.noStatus} (${PUBLISH ? "will be PUBLISHED" : "will be saved as drafts, hidden in the app"}). Without difficulty (set to Medium): ${stats.noDifficulty}.`);
console.log("Question types:", typeMap);
if (DRY) process.exit(0);

const { createClient } = await import("@supabase/supabase-js");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const chapters = JSON.parse(readFileSync("data/chapters.json", "utf8"));
let r = await sb.from("chapters").upsert(chapters); if (r.error) throw r.error;
for (let i = 0; i < rows.length; i += 200) { r = await sb.from("questions").upsert(rows.slice(i, i + 200)); if (r.error) throw r.error; }
console.log(`Seeded ${chapters.length} chapters and ${rows.length} questions.`);
