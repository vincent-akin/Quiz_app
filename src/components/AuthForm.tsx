"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
type Mode = "login" | "signup" | "forgot" | "reset";
const T: Record<Mode, [string, string]> = { login: ["Welcome back", "Sign in"], signup: ["Create your account", "Sign up"], forgot: ["Reset your password", "Send reset link"], reset: ["Choose a new password", "Save password"] };
export default function AuthForm({ mode }: { mode: Mode }) {
  const r = useRouter(), sb = supabaseBrowser();
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [name, setName] = useState("");
  const [msg, setMsg] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(""); setMsg("");
    const o = location.origin; let error;
    if (mode === "login") ({ error } = await sb.auth.signInWithPassword({ email, password: pw }));
    if (mode === "signup") { const x = await sb.auth.signUp({ email, password: pw, options: { data: { display_name: name }, emailRedirectTo: `${o}/auth/callback` } }); error = x.error; if (!error) setMsg("Check your email to confirm your account, then sign in."); }
    if (mode === "forgot") { ({ error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${o}/auth/callback?next=/reset` })); if (!error) setMsg("If that email has an account, a reset link is on its way."); }
    if (mode === "reset") ({ error } = await sb.auth.updateUser({ password: pw }));
    setBusy(false);
    if (error) return setErr(error.message);
    if (mode === "login" || mode === "reset") { r.push("/dashboard"); r.refresh(); }
  }
  return (
    <form onSubmit={submit} className="raised p-8 w-full max-w-md mx-auto flex flex-col gap-4">
      <h1 className="text-3xl font-extrabold text-center">{T[mode][0]}</h1>
      {mode === "signup" && <input className="field" placeholder="Display name" aria-label="Display name" value={name} onChange={e => setName(e.target.value)} required />}
      {mode !== "reset" && <input className="field" type="email" placeholder="Email" aria-label="Email" value={email} onChange={e => setEmail(e.target.value)} required />}
      {mode !== "forgot" && <input className="field" type="password" placeholder={mode === "reset" ? "New password" : "Password"} aria-label="Password" minLength={8} value={pw} onChange={e => setPw(e.target.value)} required />}
      {err && <p role="alert" className="text-sm" style={{color:"var(--red)"}}>{err}</p>}
      {msg && <p role="status" className="text-sm" style={{color:"var(--green)"}}>{msg}</p>}
      <button className="btn pri" disabled={busy}>{busy ? "Please wait…" : T[mode][1]}</button>
      <div className="text-sm text-center flex flex-col gap-1" style={{color:"var(--mute)"}}>
        {mode === "login" && <><Link href="/forgot">Forgot password?</Link><Link href="/signup">New here? Create an account</Link></>}
        {mode === "signup" && <Link href="/login">Already have an account? Sign in</Link>}
        {mode === "forgot" && <Link href="/login">Back to sign in</Link>}
      </div>
    </form>
  );
}
