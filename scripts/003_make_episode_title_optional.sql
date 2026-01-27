-- Make episode name optional in the database
-- Allow NULL values for the name field in content table
-- This is useful for episodes that can be identified by series + season + episode number
alter table public.content 
  alter column name drop not null;

-- Add a comment to clarify that name is optional for episodes
comment on column public.content.name is 'Content name/title. Optional for episodes (can be identified by series + season + episode number)';
