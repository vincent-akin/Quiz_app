# MRI Mastery

MRI quiz and study platform: Next.js (App Router), TypeScript, JS, Tailwind, Supabase (Auth, Postgres, RLS) and a server-side DeepSeek tutor. 

## Setup
1. `npm install`
2. Create a Supabase project. In the SQL editor, run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local` and fill in the values. Keep `SUPABASE_SERVICE_ROLE_KEY` and `DEEPSEEK_API_KEY` server-side only.
4. `npm run seed` imports `data/chapters.json` and `data/questions/*.json`.
5. `npm run dev`, then open http://localhost:3000.

## Supabase Auth
Add your site URL and `<your-url>/auth/callback` to Authentication > URL Configuration (localhost and the Vercel URL).

## Deploy to Vercel
Push to GitHub, import the repo in Vercel, add the four environment variables, deploy, update the Supabase redirect URLs, then test sign-up, password recovery, and RLS with two accounts.

## Question bank
`data/questions/chapter-N.json` holds a small sample set (2 per chapter). Replace and extend it with reviewed questions (target 700 to 1,400). Keep IDs stable. Set `"status": "published"` only after verification. Question format: `id, chapter, topic, type, text, options[], answer[] (option indexes), explanation, difficulty, source_note, status`.

## Notes
- Check DeepSeek pricing and model names in the official docs before launch (`DEEPSEEK_MODEL`).
- Account deletion requests land in the `deletion_requests` table for the administrator to process.
- Tutor usage limit is 20 messages per user per hour (`LIMIT_PER_HOUR` in `src/app/api/tutor/route.ts`).
- Bookmark
