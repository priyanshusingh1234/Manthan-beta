-- Notifications table
-- Run this in Supabase SQL Editor

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null,
  -- Types: 'new_follower' | 'answer_approved' | 'answer_flagged' | 'ai_confirmed_correct' | 'ai_confirmed_wrong' | 'points_earned' | 'new_question'
  title         text not null,
  body          text not null,
  href          text,           -- optional link to navigate to
  actor_id      uuid,           -- who triggered the notification (follower, checker, etc.)
  actor_name    text,
  actor_avatar  text,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Index for fast user notification queries
create index if not exists idx_notifications_user_id on public.notifications(user_id, created_at desc);

-- RLS: users can only see their own notifications
alter table public.notifications enable row level security;

create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications (mark read)"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Service role can insert (used by API routes via supabaseAdmin)
create policy "Service role can insert notifications"
  on public.notifications for insert
  with check (true);

create policy "Service role can delete notifications"
  on public.notifications for delete
  using (true);
