"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
export const NAV = [["/dashboard","Dashboard","home"],["/chapters","Chapters","book"],["/quiz","Quiz","target"],["/bookmarks","Bookmarks","mark"],["/progress","Progress","chart"],["/tutor","AI Tutor","ai"],["/settings","Settings","gear"]];
export default function Sidebar() {
  const p = usePathname();
  const on = (h: string) => p.startsWith(h) ? "on" : "";
  return (<>
    <aside className="side">
      <Link href="/dashboard" className="flex items-center gap-2.5 font-display font-extrabold text-xl mx-2 mb-6"><span className="ico" style={{background:"var(--ink)",color:"var(--bg)",width:38,height:38,borderRadius:12}}><Icon n="brain"/></span>MRI Mastery</Link>
      {NAV.map(([h,l,i]) => <Link key={h} href={h} className={`nv ${on(h)}`}><Icon n={i}/>{l}</Link>)}
      <div className="raised mt-auto p-4 text-center"><div className="ico mx-auto mb-2" style={{background:"var(--orange)"}}><Icon n="ai"/></div><b className="d">Stuck on a topic?</b><p className="text-[13px] my-1.5" style={{color:"var(--mute)"}}>Ask the AI tutor for a simple explanation.</p><Link href="/tutor" className="btn blu" style={{padding:"10px 20px"}}>Ask AI</Link></div>
    </aside>
    <nav className="tabs raised">{[0,1,2,5,6].map(k => <Link key={NAV[k][0]} href={NAV[k][0]} aria-label={NAV[k][1]} className={on(NAV[k][0])}><Icon n={NAV[k][2]}/></Link>)}</nav>
  </>);
}
