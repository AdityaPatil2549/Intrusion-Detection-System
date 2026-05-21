-- Run this in your Supabase SQL Editor

-- Create a table for storing analysis history
create table public.analysis_history (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    total_records integer not null,
    threat_level numeric not null,
    filename text,
    normal_count integer,
    dos_count integer,
    probe_count integer,
    r2l_count integer,
    u2r_count integer
);

-- Turn on Row Level Security (RLS)
alter table public.analysis_history enable row level security;

-- Create policy so users can only insert their own data
create policy "Users can insert their own history."
on public.analysis_history for insert
with check ( auth.uid() = user_id );

-- Create policy so users can only select their own data
create policy "Users can view their own history."
on public.analysis_history for select
using ( auth.uid() = user_id );
