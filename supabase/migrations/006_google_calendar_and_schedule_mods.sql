-- Add google_event_id to schedules
alter table public.schedules
add column if not exists google_event_id text;

-- Connected accounts (Google OAuth tokens)
create table if not exists public.connected_accounts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  provider text not null default 'google',
  access_token text not null,
  refresh_token text not null,
  expires_at bigint,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(worker_id, provider)
);

create index if not exists connected_accounts_worker_idx on public.connected_accounts(worker_id, provider);

alter table public.connected_accounts enable row level security;

create policy "Company connected_accounts select"
  on public.connected_accounts for select
  using (company_id = public.get_user_company_id());

create policy "Company connected_accounts insert"
  on public.connected_accounts for insert
  with check (company_id = public.get_user_company_id());

create policy "Company connected_accounts update"
  on public.connected_accounts for update
  using (company_id = public.get_user_company_id());

create policy "Company connected_accounts delete"
  on public.connected_accounts for delete
  using (company_id = public.get_user_company_id());

-- Schedule modifications (audit trail)
create table if not exists public.schedule_modifications (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  modified_by uuid references public.workers(id) on delete set null,
  modified_by_admin uuid references public.admin_users(id) on delete set null,
  original_start_time time not null,
  original_end_time time not null,
  new_start_time time not null,
  new_end_time time not null,
  original_date date not null,
  new_date date not null,
  reason text,
  google_synced boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists schedule_mods_schedule_idx on public.schedule_modifications(schedule_id);
create index if not exists schedule_mods_company_idx on public.schedule_modifications(company_id);

alter table public.schedule_modifications enable row level security;

create policy "Company schedule_modifications select"
  on public.schedule_modifications for select
  using (company_id = public.get_user_company_id());

create policy "Company schedule_modifications insert"
  on public.schedule_modifications for insert
  with check (company_id = public.get_user_company_id());
