-- Fix RLS recursion for location-images bucket by using SECURITY DEFINER helper
create or replace function public.is_location_owner_for_storage(p_location_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.locations l
    join public.businesses b on b.id = l.business_id
    where l.id = p_location_id
      and b.owner_id = auth.uid()
  );
$$;

-- Drop existing policies for location-images if present, to avoid duplicates
do $$
begin
  if exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'objects' and p.polname = 'Business owners can upload location images'
  ) then
    drop policy "Business owners can upload location images" on storage.objects;
  end if;

  if exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'objects' and p.polname = 'Business owners can update location images'
  ) then
    drop policy "Business owners can update location images" on storage.objects;
  end if;

  if exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'objects' and p.polname = 'Business owners can delete location images'
  ) then
    drop policy "Business owners can delete location images" on storage.objects;
  end if;
end
$$;

-- Recreate policies scoped to location-images bucket using helper
create policy "Business owners can upload location images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'location-images'
  and public.is_location_owner_for_storage( (storage.foldername(name))[1]::uuid )
);

create policy "Business owners can update location images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'location-images'
  and public.is_location_owner_for_storage( (storage.foldername(name))[1]::uuid )
)
with check (
  bucket_id = 'location-images'
  and public.is_location_owner_for_storage( (storage.foldername(name))[1]::uuid )
);

create policy "Business owners can delete location images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'location-images'
  and public.is_location_owner_for_storage( (storage.foldername(name))[1]::uuid )
);

-- Ensure public read policy exists
do $$
begin
  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'objects' and p.polname = 'Public can read location images'
  ) then
    create policy "Public can read location images"
    on storage.objects
    for select
    using ( bucket_id = 'location-images' );
  end if;
end $$;