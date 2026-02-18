-- MyPocketWatch: Initial Schema
-- Run this in your Supabase SQL editor or via supabase db push

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- HELPER: auto-update updated_at
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- COMPANIES
-- ============================================================
create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'America/New_York',
  pay_period_type text not null default 'biweekly'
    check (pay_period_type in ('weekly','biweekly','semimonthly','monthly')),
  overtime_threshold_daily numeric not null default 0,
  overtime_threshold_weekly numeric not null default 40,
  overtime_multiplier numeric not null default 1.5,
  business_phone text,
  business_email text,
  subscription_status text not null default 'trial',
  subscription_tier text not null default 'free',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.update_updated_at();

-- ============================================================
-- ADMIN USERS
-- ============================================================
create table public.admin_users (
  id uuid primary key default uuid_generate_v4(),
  auth_uid uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'admin'
    check (role in ('owner','admin','manager')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index admin_users_auth_uid_idx on public.admin_users(auth_uid);
create index admin_users_company_id_idx on public.admin_users(company_id);

create trigger admin_users_updated_at
  before update on public.admin_users
  for each row execute function public.update_updated_at();

-- ============================================================
-- WORKERS
-- ============================================================
create table public.workers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  hourly_rate numeric,
  position text,
  color text not null default ('#' || lpad(to_hex((random() * 16777215)::int), 6, '0')),
  is_active boolean not null default true,
  hire_date date,
  phone_verified boolean not null default false,
  onboarding_completed boolean not null default false,
  preferred_communication text not null default 'sms'
    check (preferred_communication in ('sms','whatsapp','telegram','messenger')),
  whatsapp_id text,
  telegram_id text,
  messenger_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workers_company_id_idx on public.workers(company_id);
create index workers_phone_idx on public.workers(phone);
create index workers_telegram_id_idx on public.workers(telegram_id);
create index workers_messenger_id_idx on public.workers(messenger_id);

create trigger workers_updated_at
  before update on public.workers
  for each row execute function public.update_updated_at();

-- ============================================================
-- TEAM HIERARCHY
-- ============================================================
create table public.team_hierarchy (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  level int not null default 0,
  sort_order int not null default 0,
  parent_id uuid references public.team_hierarchy(id) on delete set null,
  manager_id uuid references public.workers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index team_hierarchy_company_id_idx on public.team_hierarchy(company_id);

create trigger team_hierarchy_updated_at
  before update on public.team_hierarchy
  for each row execute function public.update_updated_at();

-- ============================================================
-- SCHEDULES
-- ============================================================
create table public.schedules (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  break_minutes int not null default 0,
  notes text,
  created_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index schedules_company_date_idx on public.schedules(company_id, date);
create index schedules_worker_date_idx on public.schedules(worker_id, date);

create trigger schedules_updated_at
  before update on public.schedules
  for each row execute function public.update_updated_at();

-- ============================================================
-- TIME ENTRIES
-- ============================================================
create table public.time_entries (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  clock_in timestamptz not null,
  clock_out timestamptz,
  lunch_out timestamptz,
  lunch_in timestamptz,
  break_minutes int not null default 0,
  entry_type text not null default 'regular'
    check (entry_type in ('regular','overtime','holiday','pto')),
  source text not null default 'manual'
    check (source in ('manual','sms','whatsapp','telegram','messenger','admin')),
  notes text,
  is_correction boolean not null default false,
  corrected_entry_id uuid references public.time_entries(id) on delete set null,
  approved_by uuid references public.admin_users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index time_entries_company_id_idx on public.time_entries(company_id);
create index time_entries_worker_id_idx on public.time_entries(worker_id);
create index time_entries_clock_in_idx on public.time_entries(clock_in);
create index time_entries_company_clock_in_idx on public.time_entries(company_id, clock_in);

create trigger time_entries_updated_at
  before update on public.time_entries
  for each row execute function public.update_updated_at();

-- ============================================================
-- PAYROLL PERIODS
-- ============================================================
create table public.payroll_periods (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null default 'open'
    check (status in ('open','processing','closed')),
  total_gross_amount numeric,
  closed_at timestamptz,
  closed_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payroll_periods_company_id_idx on public.payroll_periods(company_id);

create trigger payroll_periods_updated_at
  before update on public.payroll_periods
  for each row execute function public.update_updated_at();

-- ============================================================
-- PAYROLL ENTRIES
-- ============================================================
create table public.payroll_entries (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  payroll_period_id uuid not null references public.payroll_periods(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  regular_hours numeric not null default 0,
  overtime_hours numeric not null default 0,
  holiday_hours numeric not null default 0,
  pto_hours numeric not null default 0,
  hourly_rate numeric not null default 0,
  gross_pay numeric not null default 0,
  deductions jsonb not null default '{}',
  net_pay numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payroll_entries_period_idx on public.payroll_entries(payroll_period_id);
create index payroll_entries_worker_idx on public.payroll_entries(worker_id);

create trigger payroll_entries_updated_at
  before update on public.payroll_entries
  for each row execute function public.update_updated_at();

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  worker_id uuid references public.workers(id) on delete cascade,
  admin_user_id uuid references public.admin_users(id) on delete cascade,
  type text not null default 'general'
    check (type in ('no_show','missing_punch','overtime_alert','schedule_change','payroll_ready','general')),
  title text not null,
  message text not null,
  related_date date,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_company_id_idx on public.notifications(company_id);
create index notifications_worker_id_idx on public.notifications(worker_id);

-- ============================================================
-- MESSAGE LOGS
-- ============================================================
create table public.message_logs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  worker_id uuid references public.workers(id) on delete set null,
  direction text not null check (direction in ('inbound','outbound')),
  platform text not null check (platform in ('sms','whatsapp','telegram','messenger')),
  message_type text,
  to_address text not null,
  from_address text not null,
  body text not null,
  status text not null default 'queued'
    check (status in ('queued','sent','delivered','failed','received')),
  external_id text,
  created_at timestamptz not null default now()
);

create index message_logs_company_id_idx on public.message_logs(company_id);
create index message_logs_worker_id_idx on public.message_logs(worker_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  admin_user_id uuid references public.admin_users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index audit_logs_company_id_idx on public.audit_logs(company_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.companies enable row level security;
alter table public.admin_users enable row level security;
alter table public.workers enable row level security;
alter table public.team_hierarchy enable row level security;
alter table public.schedules enable row level security;
alter table public.time_entries enable row level security;
alter table public.payroll_periods enable row level security;
alter table public.payroll_entries enable row level security;
alter table public.notifications enable row level security;
alter table public.message_logs enable row level security;
alter table public.audit_logs enable row level security;

-- Helper: get the company_id for the current authenticated user
create or replace function public.get_user_company_id()
returns uuid as $$
  select company_id from public.admin_users
  where auth_uid = auth.uid() and is_active = true
  limit 1;
$$ language sql stable security definer;

-- Companies: admins can see their own company
create policy "Users can view own company"
  on public.companies for select
  using (id = public.get_user_company_id());

create policy "Owners can update own company"
  on public.companies for update
  using (id = public.get_user_company_id());

-- Admin users: can see co-admins in same company
create policy "Admins can view company admins"
  on public.admin_users for select
  using (company_id = public.get_user_company_id());

-- Workers: company-scoped
create policy "Company workers select"
  on public.workers for select
  using (company_id = public.get_user_company_id());

create policy "Company workers insert"
  on public.workers for insert
  with check (company_id = public.get_user_company_id());

create policy "Company workers update"
  on public.workers for update
  using (company_id = public.get_user_company_id());

create policy "Company workers delete"
  on public.workers for delete
  using (company_id = public.get_user_company_id());

-- Team hierarchy: company-scoped
create policy "Company teams select"
  on public.team_hierarchy for select
  using (company_id = public.get_user_company_id());

create policy "Company teams insert"
  on public.team_hierarchy for insert
  with check (company_id = public.get_user_company_id());

create policy "Company teams update"
  on public.team_hierarchy for update
  using (company_id = public.get_user_company_id());

create policy "Company teams delete"
  on public.team_hierarchy for delete
  using (company_id = public.get_user_company_id());

-- Schedules: company-scoped
create policy "Company schedules select"
  on public.schedules for select
  using (company_id = public.get_user_company_id());

create policy "Company schedules insert"
  on public.schedules for insert
  with check (company_id = public.get_user_company_id());

create policy "Company schedules update"
  on public.schedules for update
  using (company_id = public.get_user_company_id());

create policy "Company schedules delete"
  on public.schedules for delete
  using (company_id = public.get_user_company_id());

-- Time entries: company-scoped
create policy "Company time_entries select"
  on public.time_entries for select
  using (company_id = public.get_user_company_id());

create policy "Company time_entries insert"
  on public.time_entries for insert
  with check (company_id = public.get_user_company_id());

create policy "Company time_entries update"
  on public.time_entries for update
  using (company_id = public.get_user_company_id());

-- Payroll periods: company-scoped
create policy "Company payroll_periods select"
  on public.payroll_periods for select
  using (company_id = public.get_user_company_id());

create policy "Company payroll_periods insert"
  on public.payroll_periods for insert
  with check (company_id = public.get_user_company_id());

create policy "Company payroll_periods update"
  on public.payroll_periods for update
  using (company_id = public.get_user_company_id());

-- Payroll entries: company-scoped
create policy "Company payroll_entries select"
  on public.payroll_entries for select
  using (company_id = public.get_user_company_id());

create policy "Company payroll_entries insert"
  on public.payroll_entries for insert
  with check (company_id = public.get_user_company_id());

-- Notifications: company-scoped
create policy "Company notifications select"
  on public.notifications for select
  using (company_id = public.get_user_company_id());

create policy "Company notifications insert"
  on public.notifications for insert
  with check (company_id = public.get_user_company_id());

create policy "Company notifications update"
  on public.notifications for update
  using (company_id = public.get_user_company_id());

-- Message logs: company-scoped
create policy "Company message_logs select"
  on public.message_logs for select
  using (company_id = public.get_user_company_id());

create policy "Company message_logs insert"
  on public.message_logs for insert
  with check (company_id = public.get_user_company_id());

-- Audit logs: company-scoped (read-only for admins, inserts via service role)
create policy "Company audit_logs select"
  on public.audit_logs for select
  using (company_id = public.get_user_company_id());

-- ============================================================
-- REALTIME (enable for live status)
-- ============================================================
alter publication supabase_realtime add table public.time_entries;
alter publication supabase_realtime add table public.notifications;
