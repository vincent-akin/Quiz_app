import type { Metadata, Viewport } from "next";
import { Outfit, Nunito_Sans } from "next/font/google";
import "./globals.css";
const display = Outfit({ subsets: ["latin"], variable: "--font-display", weight: ["400", "600", "800"] });
const body = Nunito_Sans({ subsets: ["latin"], variable: "--font-body" });
export const metadata: Metadata = { title: "MRI Mastery", description: "Practise MRI one question at a time." };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${display.variable} ${body.variable}`}><body className="font-sans">{children}</body></html>;
}
