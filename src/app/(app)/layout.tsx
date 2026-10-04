import Sidebar from "@/components/Sidebar";
import Blobs from "@/components/Blobs";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (<><Blobs /><div className="shell"><Sidebar /><main className="mainpad px-4 md:px-10 py-7 max-w-[1100px] w-full">{children}</main></div></>);
}
