import Link from "next/link";
import Top from "@/components/Top";
import Icon from "@/components/Icon";
import { supabaseServer } from "@/lib/supabase/server";
const COL = ["#3b9ae1", "#e8742c", "#2fa36b", "#8a6df0", "#e8a42c", "#d9443f", "#3b9ae1"];
export default async function Chapters() {
  const sb = await supabaseServer();
  const { data } = await sb.from("chapters").select("*, questions(count)").order("chapter_number");
  return (<><Top title="Chapters" sub="MRI in Practice, Chapters 1 to 7" />
    <div className="grid gap-5" style={{gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))"}}>
      {(data || []).map((c: any) => <Link key={c.id} href={`/quiz?chapter=${c.id}`} className="raised p-5 block">
        <div className="ico" style={{background:COL[c.chapter_number - 1]}}><Icon n="book"/></div>
        <h3 className="font-extrabold text-[17px] mt-3 mb-1">Chapter {c.chapter_number}: {c.title}</h3>
        <p className="text-sm" style={{color:"var(--mute)"}}>{c.description}</p><span className="pill mt-3">{c.questions?.[0]?.count ?? 0} questions</span>
      </Link>)}
    </div></>);
}
