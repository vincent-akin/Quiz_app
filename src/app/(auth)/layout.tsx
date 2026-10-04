import Link from "next/link";
import Blobs from "@/components/Blobs";
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (<><Blobs /><main className="relative z-10 min-h-screen grid place-items-center p-5"><div className="w-full"><Link href="/" className="block text-center font-display font-extrabold text-2xl mb-6">MRI Mastery</Link>{children}</div></main></>);
}
