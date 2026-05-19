create table if not exists follow_requests (
    id uuid default gen_random_uuid() primary key,
    follower_id uuid references auth.users(id) on delete cascade not null,
    following_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default now(),
    unique(follower_id, following_id)
);
