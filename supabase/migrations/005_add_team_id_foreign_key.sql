-- Add team_id foreign key to workers table
-- Allows workers to belong to a team (via team_hierarchy)

alter table public.workers 
add column if not exists team_id uuid references public.team_hierarchy(id) on delete set null;

create index if not exists workers_team_id_idx on public.workers(team_id);
