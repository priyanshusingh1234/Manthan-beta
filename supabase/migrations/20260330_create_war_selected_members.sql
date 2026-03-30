create table if not exists public.war_selected_members (
    id uuid primary key default gen_random_uuid(),
    war_id uuid not null references public.wars(id) on delete cascade,
    school_id uuid not null references public.schools(id) on delete cascade,
    user_id uuid not null,
    created_at timestamptz not null default now(),
    unique (war_id, school_id, user_id)
);

create index if not exists idx_war_selected_members_war_school
    on public.war_selected_members (war_id, school_id);

create index if not exists idx_war_selected_members_user
    on public.war_selected_members (user_id);
