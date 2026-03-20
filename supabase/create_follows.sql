-- Table to track user follows
create table if not exists public.follows (
    id uuid default gen_random_uuid() primary key,
    follower_id uuid references auth.users not null,
    following_id uuid references auth.users not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(follower_id, following_id)
);

-- Enable RLS
alter table public.follows enable row level security;

-- Policies
create policy "Public follow lists are viewable by everyone." on public.follows
  for select using (true);

create policy "Users can insert their own follows." on public.follows
  for insert with check (auth.uid() = follower_id);

create policy "Users can delete their own follows." on public.follows
  for delete using (auth.uid() = follower_id);
