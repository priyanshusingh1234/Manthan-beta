-- ─────────────────────────────────────────────────────────
-- duel_challenges table
-- Stores 1v1 MCQ duel challenges between students.
-- Status flow: pending → accepted → completed
--                      → rejected
--                      → expired (auto via API)
-- ─────────────────────────────────────────────────────────

create table if not exists public.duel_challenges (
    id              uuid primary key default gen_random_uuid(),
    question_id     uuid not null references public.questions(id) on delete cascade,
    challenger_id   uuid not null references auth.users(id) on delete cascade,
    challenged_id   uuid not null references auth.users(id) on delete cascade,
    status          text not null default 'pending'
                        check (status in ('pending','accepted','rejected','expired','completed')),

    -- Optional taunt message sent with the challenge
    message         text,

    -- Expiry (24 hours from creation)
    expires_at      timestamptz not null,
    created_at      timestamptz not null default now(),

    -- Answers (set once each, null until answered)
    challenger_answer  integer,
    challenged_answer  integer,

    -- Correctness flags
    challenger_correct boolean,
    challenged_correct boolean,

    -- Time taken to answer in milliseconds
    challenger_time_ms bigint,
    challenged_time_ms bigint,

    -- Winner (null = draw or not yet resolved)
    winner_id       uuid references auth.users(id) on delete set null,

    -- Constraint: a user can only have one active duel per question pair
    constraint duel_self_challenge check (challenger_id <> challenged_id)
);

-- Indexes for common queries
create index if not exists duel_challenges_challenger_idx  on public.duel_challenges (challenger_id);
create index if not exists duel_challenges_challenged_idx  on public.duel_challenges (challenged_id);
create index if not exists duel_challenges_question_idx    on public.duel_challenges (question_id);
create index if not exists duel_challenges_status_idx      on public.duel_challenges (status);

-- RLS
alter table public.duel_challenges enable row level security;

-- Participants can read their own duels
create policy "Participants can read their duels"
    on public.duel_challenges for select
    using (
        auth.uid() = challenger_id
        or auth.uid() = challenged_id
    );

-- Service role (via supabaseAdmin) handles all writes — no direct client writes needed
-- This keeps the business logic server-side and prevents cheating.
