-- Add manager_id foreign key to workers table
-- Allows workers to report to other workers (managers/leads)

alter table public.workers 
add column if not exists manager_id uuid references public.workers(id) on delete set null;

create index if not exists workers_manager_id_idx on public.workers(manager_id);
