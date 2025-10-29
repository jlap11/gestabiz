-- Fix RPC get_wizard_business_data to align with current services schema
-- Uses CREATE OR REPLACE to avoid duplicate creation and keep idempotency

create or replace function public.get_wizard_business_data(p_business_id uuid)
returns jsonb
language sql
stable
security invoker
as $$
  with loc as (
    select 
      id,
      business_id,
      name,
      address,
      city,
      state,
      latitude,
      longitude,
      opens_at,
      closes_at,
      is_active
    from public.locations
    where business_id = p_business_id
      and is_active = true
    order by name
  ),
  svc_raw as (
    select 
      id,
      business_id,
      name,
      description,
      price,
      currency,
      duration_minutes,
      category,
      is_active
    from public.services
    where business_id = p_business_id
      and is_active = true
    order by name
  ),
  svc as (
    select 
      id,
      business_id,
      name,
      description,
      price,
      currency,
      coalesce(duration_minutes, 0) as duration,
      category,
      is_active
    from svc_raw
  )
  select jsonb_build_object(
    'locations', coalesce((select jsonb_agg(loc) from loc), '[]'::jsonb),
    'services', coalesce((select jsonb_agg(svc) from svc), '[]'::jsonb)
  );
$$;

-- SECURITY INVOKER ensures RLS rules are applied for the caller

