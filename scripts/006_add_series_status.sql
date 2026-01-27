-- Add status field to series table (in_progress, abandoned, completed)
alter table public.series 
add column if not exists status text default 'in_progress' check (status in ('in_progress', 'abandoned', 'completed'));

-- Migrate existing completed boolean to status
update public.series 
set status = 'completed' 
where completed = true;

-- Drop the old completed column
alter table public.series 
drop column if exists completed;

-- Add index for faster queries on series status
create index if not exists idx_series_status on public.series(status, user_id);
