-- Create location_media table if it doesn't exist
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

-- Enable RLS
alter table public.location_media enable row level security;

-- Create policies if they don't exist
do $$
begin
  -- Select policy for authenticated users
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

  -- Insert policy for location owners
  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'location_media' and p.polname = 'Insert location media (owner)'
  ) then
    create policy "Insert location media (owner)"
    on public.location_media
    for insert
    to authenticated
    with check (
      exists (
        select 1 from public.locations l
        join public.businesses b on b.id = l.business_id
        where l.id = location_id and b.owner_id = auth.uid()
      )
    );
  end if;

  -- Update policy for location owners
  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'location_media' and p.polname = 'Update location media (owner)'
  ) then
    create policy "Update location media (owner)"
    on public.location_media
    for update
    to authenticated
    using (
      exists (
        select 1 from public.locations l
        join public.businesses b on b.id = l.business_id
        where l.id = location_id and b.owner_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1 from public.locations l
        join public.businesses b on b.id = l.business_id
        where l.id = location_id and b.owner_id = auth.uid()
      )
    );
  end if;

  -- Delete policy for location owners
  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'location_media' and p.polname = 'Delete location media (owner)'
  ) then
    create policy "Delete location media (owner)"
    on public.location_media
    for delete
    to authenticated
    using (
      exists (
        select 1 from public.locations l
        join public.businesses b on b.id = l.business_id
        where l.id = location_id and b.owner_id = auth.uid()
      )
    );
  end if;
end $$;