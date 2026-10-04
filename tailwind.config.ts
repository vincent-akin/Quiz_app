import type { Config } from "tailwindcss";
export default { content: ["./src/**/*.{ts,tsx}"], theme: { extend: { fontFamily: { display: ["var(--font-display)"], sans: ["var(--font-body)"] } } }, plugins: [] } satisfies Config;
