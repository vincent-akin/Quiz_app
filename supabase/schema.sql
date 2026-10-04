-- MRI Mastery schema. Run in the Supabase SQL editor.
create table if not exists profiles (id uuid primary key references auth.users on delete cascade, display_name text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists chapters (id int primary key, chapter_number int unique not null, title text not null, description text, created_at timestamptz default now());
create table if not exists questions (
  id text primary key,
  chapter_id int not null references chapters(id),
  topic text not null, question_text text not null,
  question_type text not null check (question_type in ('single_best','multiple_select','true_false','calculation','scenario')),
  options jsonb not null, correct_answer jsonb not null, explanation text not null,
  difficulty text not null check (difficulty in ('Easy','Medium','Hard')),
  learning_objective text, source_note text,
  review_status text not null default 'draft' check (review_status in ('draft','reviewed','published')),
  created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists quiz_attempts (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, mode text not null, chapter_ids int[], total_questions int, correct_answers int, score_percentage numeric, started_at timestamptz, completed_at timestamptz);
create table if not exists quiz_responses (id uuid primary key default gen_random_uuid(), attempt_id uuid not null references quiz_attempts on delete cascade, user_id uuid not null default auth.uid() references auth.users on delete cascade, question_id text not null references questions(id), selected_answer jsonb, is_correct boolean, answered_at timestamptz default now());
create table if not exists bookmarks (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, question_id text not null references questions(id), created_at timestamptz default now(), unique (user_id, question_id));
create table if not exists ai_conversations (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, title text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists ai_messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references ai_conversations on delete cascade, user_id uuid not null default auth.uid() references auth.users on delete cascade, role text not null check (role in ('user','assistant')), content text not null, created_at timestamptz default now());
create table if not exists deletion_requests (id uuid primary key default gen_random_uuid(), user_id uuid not null unique default auth.uid() references auth.users on delete cascade, requested_at timestamptz default now());
create index if not exists qr_user on quiz_responses(user_id, answered_at desc);
create index if not exists am_user on ai_messages(user_id, created_at desc);

-- Profile row on signup
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into profiles(id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1))); return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Row Level Security
alter table profiles enable row level security; alter table chapters enable row level security; alter table questions enable row level security;
alter table quiz_attempts enable row level security; alter table quiz_responses enable row level security; alter table bookmarks enable row level security;
alter table ai_conversations enable row level security; alter table ai_messages enable row level security; alter table deletion_requests enable row level security;

create policy "own profile" on profiles for all to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "read chapters" on chapters for select to authenticated using (true);
create policy "read published questions" on questions for select to authenticated using (review_status = 'published');
-- No insert/update/delete policies on chapters/questions: only the service role (seed script) can write them.
do $$ declare t text; begin
  foreach t in array array['quiz_attempts','bookmarks','ai_conversations','deletion_requests'] loop
    execute format('create policy "own rows" on %I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop; end $$;
create policy "own responses" on quiz_responses for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (select 1 from quiz_attempts a where a.id = attempt_id and a.user_id = (select auth.uid())));
create policy "own messages" on ai_messages for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (select 1 from ai_conversations c where c.id = conversation_id and c.user_id = (select auth.uid())));
