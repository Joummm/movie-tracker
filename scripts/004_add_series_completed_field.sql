-- Add completed field to series table
alter table public.series 
add column if not exists completed boolean default false;

-- Add index for faster queries on completed series
create index if not exists idx_series_completed on public.series(completed, user_id);
