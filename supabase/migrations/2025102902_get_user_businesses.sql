-- RPC: get_user_businesses
-- Objetivo: Obtener en una sola llamada los negocios donde el usuario
-- es empleado aprobado/activo y/o owner (opcional)

create or replace function public.get_user_businesses(
  p_user_id uuid,
  p_include_owner boolean default true
)
returns table (
  id uuid,
  name text,
  description text,
  logo_url text,
  phone text,
  email text,
  address text,
  city text,
  state text
)
language sql
stable
security invoker
as $$
  with emp_biz as (
    select 
      b.id,
      b.name,
      b.description,
      b.logo_url,
      b.phone,
      b.email,
      b.address,
      b.city,
      b.state
    from public.business_employees be
    join public.businesses b on b.id = be.business_id
    where be.employee_id = p_user_id
      and be.status = 'approved'
      and be.is_active = true
      and b.is_active = true
  ),
  own_biz as (
    select 
      b.id,
      b.name,
      b.description,
      b.logo_url,
      b.phone,
      b.email,
      b.address,
      b.city,
      b.state
    from public.businesses b
    where p_include_owner
      and b.owner_id = p_user_id
      and b.is_active = true
  ),
  combined as (
    select * from emp_biz
    union
    select * from own_biz
  )
  select * from combined;
$$;

-- SECURITY INVOKER para respetar RLS al contexto del usuario

