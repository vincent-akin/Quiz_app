import Link from "next/link";
import Blobs from "@/components/Blobs";
import Icon from "@/components/Icon";
const F = [["target","#e8742c","Practice and exam modes","Instant feedback while you learn, or an exam when you are ready."],["chart","#3b9ae1","Track weak topics","See which chapters need work and revise them next."],["ai","#8a6df0","AI tutor","Ask for a clear explanation of any MRI concept."],["mark","#2fa36b","Bookmarks","Save tricky questions and come back to them."]];
export default function Landing() {
  return (<><Blobs /><div className="relative z-10 max-w-4xl mx-auto px-5 pb-16 pt-7 text-center">
    <nav className="flex justify-between items-center mb-14"><span className="font-display font-extrabold text-xl">MRI Mastery</span><div className="flex gap-3"><Link href="/login" className="btn">Sign in</Link><Link href="/signup" className="btn pri">Get started</Link></div></nav>
    <section className="raised relative px-5 pt-16 pb-12">
      <div className="absolute left-1/2 -translate-x-1/2 -top-14 w-[230px] h-[100px]" aria-hidden>
        <b className="absolute grid place-items-center text-white font-display" style={{left:0,top:20,width:54,height:44,background:"#3b9ae1",borderRadius:"18px 18px 18px 4px",fontSize:22}}>?</b>
        <b className="absolute grid place-items-center text-white font-display" style={{left:62,top:0,width:96,height:70,background:"#e8742c",borderRadius:"18px 18px 18px 4px",fontSize:44}}>?</b>
        <b className="absolute grid place-items-center font-display" style={{left:150,top:30,width:54,height:44,background:"#e9d9b8",color:"#8a7a55",borderRadius:"18px 18px 18px 4px",fontSize:22}}>…</b>
      </div>
      <h1 className="font-extrabold leading-none text-[clamp(40px,8vw,76px)]">Quiz <span style={{color:"var(--blue)"}}>Time!</span></h1>
      <p className="max-w-lg mx-auto my-5 text-lg" style={{color:"var(--mute)"}}>Practise MRI one question at a time. Cover Chapters 1 to 7, learn from every explanation and see what to revise next.</p>
      <Link href="/signup" className="btn pri"><Icon n="target"/>Start a quiz</Link>
    </section>
    <section className="grid gap-5 mt-8 text-left" style={{gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))"}}>
      {F.map(f => <div key={f[2]} className="raised p-5"><div className="ico mb-3" style={{background:f[1]}}><Icon n={f[0]}/></div><h3 className="font-extrabold text-lg">{f[2]}</h3><p className="mt-1.5 text-[15px]" style={{color:"var(--mute)"}}>{f[3]}</p></div>)}
    </section>
  </div></>);
}
