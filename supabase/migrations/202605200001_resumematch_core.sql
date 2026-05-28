create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  phone text,
  location text,
  title text,
  bio text,
  avatar_url text,
  notifications jsonb default '{}'::jsonb,
  privacy jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  skill_name text,
  name text,
  created_at timestamptz default now()
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  company text,
  duration text,
  current boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  degree text,
  school text,
  year text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  file_name text,
  score integer default 0,
  missing_keywords jsonb default '[]'::jsonb,
  improvements jsonb default '{}'::jsonb,
  summary text,
  original_resume text,
  updated_resume jsonb,
  job_description text,
  job_description_text text,
  extracted_skills jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  job_id text not null,
  job_title text,
  title text,
  company text,
  location text,
  salary text,
  match_score integer default 0,
  job_url text,
  status text default 'applied',
  applied_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id, job_id)
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references public.resume_analyses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('user', 'assistant', 'system')) not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.experiences enable row level security;
alter table public.education enable row level security;
alter table public.resume_analyses enable row level security;
alter table public.applications enable row level security;
alter table public.chat_sessions enable row level security;

drop policy if exists "profiles own select" on public.profiles;
create policy "profiles own select" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles own delete" on public.profiles;
create policy "profiles own delete" on public.profiles for delete using (auth.uid() = id);

drop policy if exists "skills own all" on public.skills;
create policy "skills own all" on public.skills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "experiences own all" on public.experiences;
create policy "experiences own all" on public.experiences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "education own all" on public.education;
create policy "education own all" on public.education for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "resume analyses own all" on public.resume_analyses;
create policy "resume analyses own all" on public.resume_analyses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "applications own all" on public.applications;
create policy "applications own all" on public.applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "chat sessions own all" on public.chat_sessions;
create policy "chat sessions own all" on public.chat_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists resume_analyses_user_created_idx on public.resume_analyses(user_id, created_at desc);
create index if not exists applications_user_applied_idx on public.applications(user_id, applied_at desc);
create index if not exists chat_sessions_analysis_created_idx on public.chat_sessions(analysis_id, created_at);
