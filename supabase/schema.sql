-- AGENTFLOW core schema for Supabase/Postgres
-- This file defines the base tables, index hints, and row-level security rules for the product.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  country text,
  city text,
  education_level text,
  field_of_study text,
  skills text[] default '{}',
  interests text[] default '{}',
  preferences jsonb default '{}',
  cv_url text,
  notification_channel text default 'email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'moderator', 'member')),
  created_at timestamptz not null default now()
);

create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  organization text not null,
  category text not null,
  description text not null,
  eligibility_text text,
  benefits text[] default '{}',
  funding_type text not null,
  location text not null,
  country text not null,
  work_mode text not null,
  education_levels text[] default '{}',
  apply_url text,
  source_url text,
  deadline timestamptz,
  status text not null default 'published' check (status in ('published', 'draft', 'archived')),
  is_verified boolean not null default false,
  legitimacy_score integer default 0,
  legitimacy_reasons jsonb default '[]'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_opportunities (
  user_id uuid references auth.users(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  stage text not null default 'saved' check (stage in ('saved', 'preparing', 'applied', 'interview', 'offer', 'rejected')),
  notes text,
  checklist jsonb default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  file_url text not null,
  kind text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  remind_at timestamptz not null,
  channel text not null default 'email',
  sent boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  user_id uuid references auth.users(id),
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  kind text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists opportunities_status_deadline_idx
  on public.opportunities (status, deadline);

create index if not exists opportunities_category_idx
  on public.opportunities (category);

create index if not exists applications_user_stage_idx
  on public.applications (user_id, stage);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.opportunities enable row level security;
alter table public.saved_opportunities enable row level security;
alter table public.applications enable row level security;
alter table public.application_documents enable row level security;
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.ai_drafts enable row level security;

create policy "Profiles are viewable by owner"
on public.profiles
for select
using (auth.uid() = id);

create policy "Profiles can be created by owner"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Profiles can be updated by owner"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "User roles are viewable by owner or admin"
on public.user_roles
for select
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
on public.user_roles
for all
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Opportunities are publicly readable when published"
on public.opportunities
for select
using (status = 'published');

create policy "Admins can manage opportunities"
on public.opportunities
for all
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Users can manage saved opportunities"
on public.saved_opportunities
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own applications"
on public.applications
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own application documents"
on public.application_documents
for all
using (
  exists (
    select 1 from public.applications a
    where a.id = application_id and a.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.applications a
    where a.id = application_id and a.user_id = auth.uid()
  )
);

create policy "Users can manage own reminders"
on public.reminders
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own notifications"
on public.notifications
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can create reports"
on public.reports
for insert
with check (auth.uid() = user_id or user_id is null);

create policy "Moderators and admins can review reports"
on public.reports
for update
using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create policy "Users can manage own AI drafts"
on public.ai_drafts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, country, city, education_level, field_of_study, skills, interests, preferences, notification_channel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New AGENTFLOW user'),
    null,
    null,
    null,
    null,
    '{}',
    '{}',
    '{}',
    'email'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'member')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
