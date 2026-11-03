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

create index if not exists opportunity_views_opportunity_created_idx
  on public.opportunity_views (opportunity_id, created_at);

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

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Profiles can be created by owner" on public.profiles;
create policy "Profiles can be created by owner"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Profiles can be updated by owner" on public.profiles;
create policy "Profiles can be updated by owner"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "User roles are viewable by owner or admin" on public.user_roles;
create policy "User roles are viewable by owner or admin"
on public.user_roles
for select
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can manage roles" on public.user_roles;
create policy "Admins can manage roles"
on public.user_roles
for all
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Opportunities are publicly readable when published" on public.opportunities;
create policy "Opportunities are publicly readable when published"
on public.opportunities
for select
using (status = 'published');

drop policy if exists "Admins can manage opportunities" on public.opportunities;
create policy "Admins can manage opportunities"
on public.opportunities
for all
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can manage saved opportunities" on public.saved_opportunities;
create policy "Users can manage saved opportunities"
on public.saved_opportunities
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own applications" on public.applications;
create policy "Users can manage own applications"
on public.applications
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own application documents" on public.application_documents;
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

drop policy if exists "Users can manage own reminders" on public.reminders;
create policy "Users can manage own reminders"
on public.reminders
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own notifications" on public.notifications;
create policy "Users can manage own notifications"
on public.notifications
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can create reports" on public.reports;
create policy "Users can create reports"
on public.reports
for insert
with check (
  (auth.uid() = user_id or user_id is null)
  and (
    opportunity_id is null
    or exists (
      select 1 from public.opportunities
      where id = opportunity_id and status = 'published'
    )
  )
);

drop policy if exists "Moderators and admins can review reports" on public.reports;
create policy "Moderators and admins can review reports"
on public.reports
for update
using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

drop policy if exists "Users can manage own AI drafts" on public.ai_drafts;
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

-- Admin operations, moderation intake, login controls, and audit history.
create table if not exists public.opportunity_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  organization text not null,
  category text not null,
  description text not null,
  eligibility_text text,
  funding_type text not null default 'paid',
  location text not null,
  country text not null,
  work_mode text not null default 'remote',
  deadline timestamptz,
  source_url text,
  apply_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.reports add column if not exists details text;
alter table public.reports add column if not exists opportunity_slug text;
alter table public.reports add column if not exists contact_email text;
alter table public.reports alter column opportunity_id drop not null;

create table if not exists public.opportunity_views (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_security (
  user_id uuid primary key references auth.users(id) on delete cascade,
  requires_password_change boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_login_attempts (
  id bigint generated always as identity primary key,
  email text not null,
  client_ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_login_attempts_window_idx
  on public.admin_login_attempts (created_at, lower(email), client_ip);

create table if not exists public.admin_seed_runs (
  id smallint primary key default 1 check (id = 1),
  seeded_at timestamptz not null default now()
);

alter table public.opportunity_submissions enable row level security;
alter table public.opportunity_views enable row level security;
alter table public.admin_security enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.admin_login_attempts enable row level security;
alter table public.admin_seed_runs enable row level security;

create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
      and (
        _user_id = auth.uid()
        or exists (
          select 1 from public.user_roles
          where user_id = auth.uid() and role = 'admin'
        )
      )
  );
$$;

create or replace function public.admin_password_change_required()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select requires_password_change
    from public.admin_security
    where user_id = auth.uid()
  ), false);
$$;

grant execute on function public.has_role(uuid, text) to anon, authenticated;
grant execute on function public.admin_password_change_required() to authenticated;

drop policy if exists "Admins can manage roles" on public.user_roles;
create policy "Admins can manage roles"
on public.user_roles
for all
using (
  public.has_role(auth.uid(), 'admin')
  and not public.admin_password_change_required()
  and auth.jwt() ->> 'aal' = 'aal2'
)
with check (
  public.has_role(auth.uid(), 'admin')
  and not public.admin_password_change_required()
  and auth.jwt() ->> 'aal' = 'aal2'
);

drop policy if exists "Admins can manage opportunities" on public.opportunities;
drop policy if exists "Admins can read opportunities" on public.opportunities;
drop policy if exists "Admins can insert opportunities" on public.opportunities;
drop policy if exists "Admins can update opportunities" on public.opportunities;
drop policy if exists "Admins can delete opportunities" on public.opportunities;
create policy "Admins can read opportunities"
on public.opportunities
for select
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can insert opportunities" on public.opportunities;
create policy "Admins can insert opportunities"
on public.opportunities
for insert
with check (
  public.has_role(auth.uid(), 'admin')
  and not public.admin_password_change_required()
  and auth.jwt() ->> 'aal' = 'aal2'
);

drop policy if exists "Admins can update opportunities" on public.opportunities;
create policy "Admins can update opportunities"
on public.opportunities
for update
using (
  public.has_role(auth.uid(), 'admin')
  and not public.admin_password_change_required()
  and auth.jwt() ->> 'aal' = 'aal2'
)
with check (
  public.has_role(auth.uid(), 'admin')
  and not public.admin_password_change_required()
  and auth.jwt() ->> 'aal' = 'aal2'
);

drop policy if exists "Admins can delete opportunities" on public.opportunities;
create policy "Admins can delete opportunities"
on public.opportunities
for delete
using (
  public.has_role(auth.uid(), 'admin')
  and not public.admin_password_change_required()
  and auth.jwt() ->> 'aal' = 'aal2'
);

drop policy if exists "Moderators and admins can review reports" on public.reports;
drop policy if exists "Admins can view reports" on public.reports;
create policy "Admins can view reports"
on public.reports
for select
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update reports" on public.reports;
create policy "Admins can update reports"
on public.reports
for update
using (
  public.has_role(auth.uid(), 'admin')
  and not public.admin_password_change_required()
  and auth.jwt() ->> 'aal' = 'aal2'
)
with check (
  public.has_role(auth.uid(), 'admin')
  and not public.admin_password_change_required()
  and auth.jwt() ->> 'aal' = 'aal2'
);

drop policy if exists "Admins can delete reports" on public.reports;
create policy "Admins can delete reports"
on public.reports
for delete
using (
  public.has_role(auth.uid(), 'admin')
  and not public.admin_password_change_required()
  and auth.jwt() ->> 'aal' = 'aal2'
);

drop policy if exists "Users can create reports" on public.reports;
create policy "Users can create reports"
on public.reports
for insert
with check (
  (auth.uid() = user_id or user_id is null)
  and (
    opportunity_id is null
    or exists (
      select 1 from public.opportunities
      where id = opportunity_id and status = 'published'
    )
  )
);

drop policy if exists "Anyone can submit an opportunity for review" on public.opportunity_submissions;
create policy "Anyone can submit an opportunity for review"
on public.opportunity_submissions
for insert
with check (user_id is null or auth.uid() = user_id);

drop policy if exists "Admins can review opportunity submissions" on public.opportunity_submissions;
create policy "Admins can review opportunity submissions"
on public.opportunity_submissions
for select
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update opportunity submissions" on public.opportunity_submissions;
create policy "Admins can update opportunity submissions"
on public.opportunity_submissions
for update
using (
  public.has_role(auth.uid(), 'admin')
  and not public.admin_password_change_required()
  and auth.jwt() ->> 'aal' = 'aal2'
)
with check (
  public.has_role(auth.uid(), 'admin')
  and not public.admin_password_change_required()
  and auth.jwt() ->> 'aal' = 'aal2'
);

drop policy if exists "Admins can delete opportunity submissions" on public.opportunity_submissions;
create policy "Admins can delete opportunity submissions"
on public.opportunity_submissions
for delete
using (
  public.has_role(auth.uid(), 'admin')
  and not public.admin_password_change_required()
  and auth.jwt() ->> 'aal' = 'aal2'
);

drop policy if exists "Authenticated users can record their own opportunity views" on public.opportunity_views;
create policy "Authenticated users can record their own opportunity views"
on public.opportunity_views
for insert
to authenticated
with check (
  viewer_id = auth.uid()
  and exists (
    select 1 from public.opportunities
    where id = opportunity_id and status = 'published'
  )
);

drop policy if exists "Admins can read opportunity views" on public.opportunity_views;
create policy "Admins can read opportunity views"
on public.opportunity_views
for select
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can read admin security settings" on public.admin_security;
create policy "Admins can read admin security settings"
on public.admin_security
for select
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can read audit history" on public.admin_audit_log;
create policy "Admins can read audit history"
on public.admin_audit_log
for select
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can read saved opportunity analytics" on public.saved_opportunities;
create policy "Admins can read saved opportunity analytics"
on public.saved_opportunities
for select
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can read application analytics" on public.applications;
create policy "Admins can read application analytics"
on public.applications
for select
using (public.has_role(auth.uid(), 'admin'));

create or replace view public.admin_analytics
with (security_invoker = true)
as
select
  o.category,
  count(distinct v.id)::bigint as views,
  count(distinct (s.user_id, s.opportunity_id))::bigint as saves,
  count(distinct a.id)::bigint as applications
from public.opportunities o
left join public.opportunity_views v on v.opportunity_id = o.id
left join public.saved_opportunities s on s.opportunity_id = o.id
left join public.applications a on a.opportunity_id = o.id
group by o.category;

grant select on public.admin_analytics to authenticated;

grant select on public.opportunities to anon, authenticated;
grant insert, update, delete on public.opportunities to authenticated;
grant insert on public.opportunity_submissions to anon, authenticated;
grant select, update, delete on public.opportunity_submissions to authenticated;
grant insert on public.reports to anon, authenticated;
grant select, update, delete on public.reports to authenticated;
grant insert, select on public.opportunity_views to authenticated;
grant select on public.admin_security, public.admin_audit_log to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant select, insert, update, delete on public.saved_opportunities, public.applications to authenticated;
grant select, insert, update, delete on public.opportunity_submissions, public.reports to authenticated;
grant select, insert on public.opportunity_views to authenticated;
grant select, insert on public.admin_audit_log, public.admin_security to service_role;
grant select, insert, delete on public.admin_login_attempts to service_role;
grant select, insert on public.admin_seed_runs to service_role;
grant insert, update on public.user_roles, public.admin_security to service_role;

create or replace function public.check_admin_login_rate_limit(p_email text, p_ip text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  recent_failures integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(lower(p_email), 0));
  if p_ip is not null then
    perform pg_advisory_xact_lock(hashtextextended(p_ip, 0));
  end if;

  delete from public.admin_login_attempts
  where created_at < now() - interval '1 day';

  select count(*) into recent_failures
  from public.admin_login_attempts
  where created_at >= now() - interval '15 minutes'
    and (lower(email) = lower(p_email) or client_ip = coalesce(p_ip, 'unknown'));

  if recent_failures >= 5 then
    return true;
  end if;

  insert into public.admin_login_attempts (email, client_ip)
  values (lower(p_email), coalesce(p_ip, 'unknown'));
  return false;
end;
$$;

revoke all on function public.check_admin_login_rate_limit(text, text) from public, anon, authenticated;
grant execute on function public.check_admin_login_rate_limit(text, text) to service_role;

create or replace function public.audit_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed_row jsonb;
  entity_key text;
begin
  if not public.has_role(auth.uid(), 'admin') then
    return null;
  end if;
  changed_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  entity_key := coalesce(changed_row ->> 'id', changed_row ->> 'user_id');
  insert into public.admin_audit_log (actor_user_id, action, entity, entity_id)
  values (auth.uid(), lower(tg_op), tg_table_name, entity_key);
  return null;
end;
$$;

drop trigger if exists audit_admin_opportunities on public.opportunities;
create trigger audit_admin_opportunities
after insert or update or delete on public.opportunities
for each row execute function public.audit_admin_change();

drop trigger if exists audit_admin_reports on public.reports;
create trigger audit_admin_reports
after update or delete on public.reports
for each row execute function public.audit_admin_change();

drop trigger if exists audit_admin_submissions on public.opportunity_submissions;
create trigger audit_admin_submissions
after update or delete on public.opportunity_submissions
for each row execute function public.audit_admin_change();

drop trigger if exists audit_admin_roles on public.user_roles;
create trigger audit_admin_roles
after insert or update or delete on public.user_roles
for each row execute function public.audit_admin_change();

create or replace function public.complete_admin_password_change()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not authorized';
  end if;
  if auth.jwt() ->> 'aal' <> 'aal2' then
    raise exception 'multi-factor authentication required';
  end if;
  update public.admin_security
  set requires_password_change = false, updated_at = now()
  where user_id = auth.uid();
  insert into public.admin_audit_log (actor_user_id, action, entity)
  values (auth.uid(), 'password_changed', 'admin_security');
end;
$$;

revoke all on function public.complete_admin_password_change() from public, anon;
grant execute on function public.complete_admin_password_change() to authenticated;
