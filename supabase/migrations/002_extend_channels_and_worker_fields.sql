-- Extend message_logs channel to support all platforms
alter table message_logs drop constraint if exists message_logs_channel_check;
alter table message_logs add constraint message_logs_channel_check
  check (channel in ('sms', 'whatsapp', 'telegram', 'messenger', 'email', 'push'));

-- Add phone_verified to workers
alter table workers add column if not exists phone_verified boolean not null default false;
-- Add telegram_id for telegram bot integration
alter table workers add column if not exists telegram_id text;
-- Add messenger_id for facebook messenger
alter table workers add column if not exists messenger_id text;
-- Preferred messaging platform
alter table workers add column if not exists preferred_platform text default 'sms'
  check (preferred_platform in ('sms', 'whatsapp', 'telegram', 'messenger'));

-- Add is_correction and corrects_entry_id to time_entries for correction tracking
alter table time_entries add column if not exists is_correction boolean not null default false;
alter table time_entries add column if not exists corrects_entry_id uuid references time_entries(id) on delete set null;

create index if not exists idx_workers_phone on workers(phone);
create index if not exists idx_workers_telegram_id on workers(telegram_id);
create index if not exists idx_workers_messenger_id on workers(messenger_id);
