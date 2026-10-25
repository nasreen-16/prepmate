-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  college text not null default '',
  branch text not null default '',
  graduation_year int,
  target_roles text[] not null default '{}',
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ shared updated_at helper ============
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ planner_tasks ============
create table public.planner_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text not null default '',
  category text not null default 'other' check (category in ('dsa','aptitude','core_cs','project','resume','revision','other')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  due_date date,
  completed boolean not null default false,
  completed_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index planner_tasks_user_idx on public.planner_tasks (user_id, due_date);

grant select, insert, update, delete on public.planner_tasks to authenticated;
grant all on public.planner_tasks to service_role;
alter table public.planner_tasks enable row level security;
create policy "Users manage own tasks" on public.planner_tasks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger planner_tasks_updated_at before update on public.planner_tasks
for each row execute function public.set_updated_at();

-- ============ dsa_problems ============
create table public.dsa_problems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  topic text not null default 'Arrays',
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  platform text not null default 'leetcode' check (platform in ('leetcode','gfg','hackerrank','codeforces','codechef','other')),
  url text not null default '',
  status text not null default 'todo' check (status in ('todo','in_progress','solved','revisit')),
  notes text not null default '',
  revision_date date,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dsa_problems_user_idx on public.dsa_problems (user_id, status);

grant select, insert, update, delete on public.dsa_problems to authenticated;
grant all on public.dsa_problems to service_role;
alter table public.dsa_problems enable row level security;
create policy "Users manage own problems" on public.dsa_problems for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger dsa_problems_updated_at before update on public.dsa_problems
for each row execute function public.set_updated_at();

-- ============ mock_interviews ============
create table public.mock_interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  interview_type text not null check (interview_type in ('technical','hr','mixed')),
  role text not null default '',
  questions jsonb not null default '[]'::jsonb,
  overall_score numeric,
  summary text not null default '',
  created_at timestamptz not null default now()
);
create index mock_interviews_user_idx on public.mock_interviews (user_id, created_at);

grant select, insert, update, delete on public.mock_interviews to authenticated;
grant all on public.mock_interviews to service_role;
alter table public.mock_interviews enable row level security;
create policy "Users manage own mock interviews" on public.mock_interviews for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ quiz_attempts ============
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  topic text not null check (topic in ('aptitude','dbms','oop','os','cn')),
  total_questions int not null,
  correct_answers int not null,
  score numeric not null,
  duration_seconds int not null default 0,
  details jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index quiz_attempts_user_idx on public.quiz_attempts (user_id, created_at);

grant select, insert, update, delete on public.quiz_attempts to authenticated;
grant all on public.quiz_attempts to service_role;
alter table public.quiz_attempts enable row level security;
create policy "Users manage own quiz attempts" on public.quiz_attempts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ resume_analyses ============
create table public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  job_description text not null default '',
  extracted_text text not null default '',
  analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index resume_analyses_user_idx on public.resume_analyses (user_id, created_at);

grant select, insert, update, delete on public.resume_analyses to authenticated;
grant all on public.resume_analyses to service_role;
alter table public.resume_analyses enable row level security;
create policy "Users manage own resume analyses" on public.resume_analyses for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ storage: private resumes bucket ============
create policy "Users can upload own resumes" on storage.objects for insert to authenticated
with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can view own resumes" on storage.objects for select to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can delete own resumes" on storage.objects for delete to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
