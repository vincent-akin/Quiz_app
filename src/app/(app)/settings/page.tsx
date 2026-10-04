"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Top from "@/components/Top";
import Icon from "@/components/Icon";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function Settings() {
  const r = useRouter(), sb = supabaseBrowser(), [msg, setMsg] = useState("");
  async function out() { await sb.auth.signOut(); r.push("/"); r.refresh(); }
  async function del() {
    if (!confirm("Request deletion of your account and all your study data?")) return;
    const { data: { user } } = await sb.auth.getUser();
    const { error } = await sb.from("deletion_requests").upsert({ user_id: user!.id }, { onConflict: "user_id" });
    setMsg(error ? "Could not send the request. Try again." : "Request received. Your account and data will be deleted by the administrator.");
  }
  return (<><Top title="Settings" />
    <div className="raised p-6 max-w-2xl flex flex-col gap-4">
      <button className="btn" onClick={out}><Icon n="out" />Sign out</button>
      <div><h2 className="font-extrabold">Your data</h2><p className="text-sm mt-1.5" style={{color:"var(--mute)"}}>We store your email, display name, quiz attempts and answers, bookmarks, and AI tutor conversations. Only you can read them. When your account is deleted, all of this is permanently removed.</p></div>
      <button className="btn" style={{color:"var(--red)"}} onClick={del}>Request account deletion</button>
      {msg && <p role="status" className="text-sm">{msg}</p>}</div></>);
}
