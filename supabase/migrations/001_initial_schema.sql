-- profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "users_own_profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- subjects
create table subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
create index subjects_user_id_idx on subjects(user_id);
alter table subjects enable row level security;
create policy "users_own_subjects" on subjects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- questions
create table questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  link_url text,
  description text,
  created_at timestamptz not null default now()
);
create index questions_subject_id_idx on questions(subject_id);
alter table questions enable row level security;
create policy "users_own_questions" on questions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- revisions
create table revisions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  index int not null check (index between 1 and 5),
  due_date date,
  completed_at timestamptz,
  unique (question_id, index)
);
alter table revisions enable row level security;
create policy "users_own_revisions" on revisions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- fcm_tokens
create table fcm_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
alter table fcm_tokens enable row level security;
create policy "users_own_fcm_tokens" on fcm_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notifications_sent (idempotency)
create table notifications_sent (
  revision_id uuid not null references revisions(id) on delete cascade,
  slot_at timestamptz not null,
  primary key (revision_id, slot_at)
);
alter table notifications_sent enable row level security;
create policy "users_read_own_notifications_sent" on notifications_sent
  for select using (
    exists (
      select 1 from revisions r where r.id = revision_id and r.user_id = auth.uid()
    )
  );

-- Profile auto-create trigger
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'timezone', 'UTC')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
