-- Supabaseのダッシュボード → SQL Editor で実行してください

-- attemptsテーブル
create table attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  problem_id text not null,
  lap_no integer not null,
  user_answer boolean not null,
  is_correct boolean not null,
  response_time_sec numeric,
  answered_at timestamptz not null,
  created_at timestamptz default now(),
  unique(user_id, problem_id, lap_no)
);

-- Row Level Security（自分のデータしか見えない）
alter table attempts enable row level security;

create policy "Users can manage their own attempts"
  on attempts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
