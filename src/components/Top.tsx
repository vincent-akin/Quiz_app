export default function Top({ title, sub }: { title: string; sub?: string }) {
  return <header className="mb-6"><h1 className="text-[clamp(24px,4vw,34px)] font-extrabold">{title}</h1>{sub && <p className="mt-1" style={{color:"var(--mute)"}}>{sub}</p>}</header>;
}
