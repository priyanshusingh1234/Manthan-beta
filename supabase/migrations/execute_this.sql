alter table public.profiles add column is_private boolean default false;

create table if not exists public.follow_requests (
    id uuid default gen_random_uuid() primary key,
    follower_id uuid references auth.users(id) on delete cascade not null,
    following_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default now(),
    unique(follower_id, following_id)
);

alter table public.follow_requests enable row level security;

create policy "Service role can insert follow_requests"
  on public.follow_requests for insert
  with check (true);

create policy "Service role can delete follow_requests"
  on public.follow_requests for delete
  using (true);

create policy "Service role can select follow_requests"
  on public.follow_requests for select
  using (true);
