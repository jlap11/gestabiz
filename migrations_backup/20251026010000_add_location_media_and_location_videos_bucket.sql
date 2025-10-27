-- Create media table for locations and storage bucket for videos
create extension if not exists pgcrypto;

-- location_media table
create table if not exists public.location_media (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  type text not null check (type in ('image','video')),
  url text not null,
  description text,
  is_banner boolean not null default false,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.location_media enable row level security;

-- Policies
do $$
begin
  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'location_media' and p.polname = 'Select location media (authenticated)'
  ) then
    create policy "Select location media (authenticated)"
    on public.location_media
    for select
    to authenticated
    using (true);
  end if;

  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'location_media' and p.polname = 'Insert location media (owner)'
  ) then
    create policy "Insert location media (owner)"
    on public.location_media
    for insert
    to authenticated
    with check ( public.is_location_owner_for_storage(location_id) );
  end if;

  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'location_media' and p.polname = 'Update location media (owner)'
  ) then
    create policy "Update location media (owner)"
    on public.location_media
    for update
    to authenticated
    using ( public.is_location_owner_for_storage(location_id) )
    with check ( public.is_location_owner_for_storage(location_id) );
  end if;

  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'location_media' and p.polname = 'Delete location media (owner)'
  ) then
    create policy "Delete location media (owner)"
    on public.location_media
    for delete
    to authenticated
    using ( public.is_location_owner_for_storage(location_id) );
  end if;
end $$;

-- Ensure bucket 'location-videos' exists
do $$
begin
  if not exists (select 1 from storage.buckets where name = 'location-videos') then
    insert into storage.buckets (id, name, public) values ('location-videos', 'location-videos', true);
  end if;
end $$;

-- RLS policies for location-videos bucket
-- Drop if exist to avoid duplicates
do $$
begin
  if exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'objects' and p.polname = 'Business owners can upload location videos'
  ) then
    drop policy "Business owners can upload location videos" on storage.objects;
  end if;

  if exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'objects' and p.polname = 'Business owners can update location videos'
  ) then
    drop policy "Business owners can update location videos" on storage.objects;
  end if;

  if exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'objects' and p.polname = 'Business owners can delete location videos'
  ) then
    drop policy "Business owners can delete location videos" on storage.objects;
  end if;
end $$;

create policy "Business owners can upload location videos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'location-videos'
  and public.is_location_owner_for_storage( (storage.foldername(name))[1]::uuid )
);

create policy "Business owners can update location videos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'location-videos'
  and public.is_location_owner_for_storage( (storage.foldername(name))[1]::uuid )
)
with check (
  bucket_id = 'location-videos'
  and public.is_location_owner_for_storage( (storage.foldername(name))[1]::uuid )
);

create policy "Business owners can delete location videos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'location-videos'
  and public.is_location_owner_for_storage( (storage.foldername(name))[1]::uuid )
);

-- Public read policy for videos
do $$
begin
  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'objects' and p.polname = 'Public can read location videos'
  ) then
    create policy "Public can read location videos"
    on storage.objects
    for select
    using ( bucket_id = 'location-videos' );
  end if;
end $$;
