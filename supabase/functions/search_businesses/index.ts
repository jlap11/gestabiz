// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOGOTA_REGION_ID = 'fc6cc79b-dfd1-42c9-b35d-3d0df51c1c83'
const BOGOTA_CITY_ID = 'c5861b80-bd05-48a9-9e24-d8c93e0d1d6b'
const BOGOTA_CITY_NAME = 'Bogotá'

type SearchType = 'initial' | 'businesses' | 'services' | 'categories' | 'users' | 'all'

interface SearchRequest {
  type: SearchType
  term: string
  preferredRegionId?: string | null
  preferredRegionName?: string | null
  preferredCityId?: string | null
  preferredCityName?: string | null
  clientId?: string | null
  page?: number
  pageSize?: number
  excludeBusinessIds?: string[]
  // Filtros de rating solo aplican para la primera página (primeros 12)
  minRating?: number
  minReviewCount?: number
}

serve(async (req) => {
  try {
    const corsHeaders = {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
      'Access-Control-Max-Age': '86400'
    }

    if (req.method === 'OPTIONS') {
      return new Response('', { status: 200, headers: corsHeaders })
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders })
    }

    const url = Deno.env.get('SUPABASE_URL')!
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(url, key)

    const body = (await req.json()) as SearchRequest
    const {
      type,
      term,
      preferredRegionId,
      preferredRegionName,
      preferredCityId,
      preferredCityName,
      clientId,
      page = 1,
      pageSize = 12,
      excludeBusinessIds = [],
      minRating,
      minReviewCount
    } = body

    const normalize = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const isBogotaRegionById = preferredRegionId === BOGOTA_REGION_ID
    const isBogotaCityById = preferredCityId === BOGOTA_CITY_ID
    const isBogotaRegionByName = preferredRegionName ? normalize(preferredRegionName).includes('bogota') : false
    const isBogotaCityByName = preferredCityName ? normalize(preferredCityName).includes('bogota') : false

    // Resolver IDs por nombre cuando solo tenemos nombres (compatibilidad con datos mixtos UUID/texto)
    let resolvedCityIds: string[] = []
    let resolvedRegionIds: string[] = []
    try {
      if (!preferredCityId && (preferredCityName || isBogotaCityByName)) {
        const cityFilter = (isBogotaCityByName ? BOGOTA_CITY_NAME : (preferredCityName || ''))
        const cityNoAccent = cityFilter.replaceAll('á','a').replaceAll('é','e').replaceAll('í','i').replaceAll('ó','o').replaceAll('ú','u')
        const cityOr = `name.ilike.%${cityFilter}%,name.ilike.%${cityNoAccent}%${normalize(cityFilter).includes('bogota') ? ',name.ilike.%Bogot%' : ''}`
        const { data: cityRows } = await supabase
          .from('cities')
          .select('id, name')
          // deno-lint-ignore no-explicit-any
          .or(cityOr as any)
        resolvedCityIds = (cityRows || []).map((r: any) => r.id).filter(Boolean)
      }
      if (!preferredRegionId && (preferredRegionName || isBogotaRegionByName)) {
        const regionFilter = (isBogotaRegionByName ? 'Bogotá D.C.' : (preferredRegionName || ''))
        const regionNoAccent = regionFilter.replaceAll('á','a').replaceAll('é','e').replaceAll('í','i').replaceAll('ó','o').replaceAll('ú','u')
        const regionOr = `name.ilike.%${regionFilter}%,name.ilike.%${regionNoAccent}%${normalize(regionFilter).includes('bogota') ? ',name.ilike.%Bogot%' : ''}`
        const { data: regionRows } = await supabase
          .from('regions')
          .select('id, name')
          // deno-lint-ignore no-explicit-any
          .or(regionOr as any)
        resolvedRegionIds = (regionRows || []).map((r: any) => r.id).filter(Boolean)
      }
    } catch (_) {
      // Silencio: si falla el catálogo, seguimos con filtros por texto
    }

    // 1) Filtrar ubicaciones por ciudad/región para obtener negocios de la ciudad
    //    Preferir ID (UUID) en columnas city/state, PERO combinar con nombre
    //    para compatibilidad con datos existentes que guardan texto.
    let locQuery = supabase
      .from('locations')
      .select('id, business_id, city, state')
      .eq('is_active', true)

    // Si hay IDs, construir un OR combinando igualdad por ID y coincidencia por nombre
    if (preferredCityId || preferredRegionId) {
      const clauses: string[] = []
      const effectiveCityIds = preferredCityId ? [preferredCityId] : resolvedCityIds
      const effectiveRegionIds = preferredRegionId ? [preferredRegionId] : resolvedRegionIds

      if (effectiveCityIds && effectiveCityIds.length > 0) {
        for (const cid of effectiveCityIds) {
          clauses.push(`city.eq.${cid}`)
        }
        // Incluir nombre si viene o si es Bogotá por heurística
        const cityNameFilter = (isBogotaCityById || isBogotaCityByName)
          ? BOGOTA_CITY_NAME
          : (preferredCityName ?? '')
        if (cityNameFilter) {
          // Coincidencia con y sin acento (Bogotá/Bogota)
          clauses.push(`city.ilike.%${cityNameFilter}%`)
          const cityNameNoAccent = cityNameFilter.replaceAll('á','a').replaceAll('é','e').replaceAll('í','i').replaceAll('ó','o').replaceAll('ú','u')
          if (cityNameNoAccent && cityNameNoAccent !== cityNameFilter) {
            clauses.push(`city.ilike.%${cityNameNoAccent}%`)
          }
          // Para Bogotá, capturar prefijo común
          if (normalize(cityNameFilter).includes('bogota')) {
            clauses.push(`city.ilike.%Bogot%`)
            // Fallback por nombre de la sede
            clauses.push(`name.ilike.%Bogot%`)
          }
        }
      }
      if (effectiveRegionIds && effectiveRegionIds.length > 0) {
        for (const rid of effectiveRegionIds) {
          clauses.push(`state.eq.${rid}`)
        }
        const regionNameFilter = (isBogotaRegionById || isBogotaRegionByName)
          ? 'Bogotá D.C.'
          : (preferredRegionName ?? '')
        if (regionNameFilter) {
          // Coincidencia con y sin acento
          clauses.push(`state.ilike.%${regionNameFilter}%`)
          const regionNoAccent = regionNameFilter.replaceAll('á','a').replaceAll('é','e').replaceAll('í','i').replaceAll('ó','o').replaceAll('ú','u')
          if (regionNoAccent && regionNoAccent !== regionNameFilter) {
            clauses.push(`state.ilike.%${regionNoAccent}%`)
          }
          // Para Bogotá, considerar coincidencia también en city y prefijo
          if (isBogotaRegionById || isBogotaRegionByName) {
            clauses.push(`city.ilike.%Bogotá%`)
            clauses.push(`city.ilike.%Bogot%`)
            // Fallback por nombre de la sede
            clauses.push(`name.ilike.%Bogot%`)
          }
        }
      }
      // deno-lint-ignore no-explicit-any
      ;(locQuery as any) = (locQuery as any).or(clauses.join(','))
    } else if (preferredCityName || isBogotaCityByName) {
      // Respaldo por nombre de ciudad (para compatibilidad retro)
      const cityFilter = isBogotaCityByName ? BOGOTA_CITY_NAME : (preferredCityName as string)
      // Coincidencia con y sin acento
      // deno-lint-ignore no-explicit-any
      ;(locQuery as any) = (locQuery as any).or(
        `city.ilike.%${cityFilter}%,city.ilike.%${cityFilter.replaceAll('á','a').replaceAll('é','e').replaceAll('í','i').replaceAll('ó','o').replaceAll('ú','u')}%${normalize(cityFilter).includes('bogota') ? ',city.ilike.%Bogot%,name.ilike.%Bogot%' : ''},name.ilike.%${cityFilter}%`
      )
    } else if (preferredRegionName || isBogotaRegionByName) {
      // Respaldo por nombre de región/departamento
      const regionFilter = isBogotaRegionByName ? 'Bogotá D.C.' : (preferredRegionName as string)
      // Considerar coincidencias tanto en state como en city para regiones tipo Bogotá
      const noAccent = regionFilter.replaceAll('á','a').replaceAll('é','e').replaceAll('í','i').replaceAll('ó','o').replaceAll('ú','u')
      const orFilter = `state.ilike.%${regionFilter}%,state.ilike.%${noAccent}%,city.ilike.%${regionFilter}%,city.ilike.%${noAccent}%${normalize(regionFilter).includes('bogota') ? ',city.ilike.%Bogot%,name.ilike.%Bogot%' : ''},name.ilike.%${regionFilter}%`
      // deno-lint-ignore no-explicit-any
      ;(locQuery as any) = (locQuery as any).or(orFilter)
    }

    const { data: locations, error: locError } = await locQuery
    if (locError) throw locError

    const cityBusinessIds = Array.from(new Set((locations || []).map((l: any) => l.business_id))).filter(Boolean)
    const locationsCountMap: Record<string, number> = {}
    for (const l of locations || []) {
      const bid = (l as any).business_id
      if (!bid) continue
      locationsCountMap[bid] = (locationsCountMap[bid] || 0) + 1
    }
    const cityLocationIds = Array.from(new Set((locations || []).map((l: any) => l.id))).filter(Boolean)

    // 2) Construir candidatos según tipo de búsqueda
    let candidateBusinessIds: string[] = []
    let businessRows: any[] = []
    const matchSourcesByBusinessId: Record<string, string[]> = {}

    if (type === 'initial') {
      // Listado inicial: traer negocios por ciudad, aplicar disponibilidad y priorizar por citas del cliente en la ciudad
      const { data: businesses, error } = await supabase
        .from('businesses')
        .select('id, name, description, logo_url, address, city, phone, category_id')
        .in('id', cityBusinessIds)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('name')
      if (error) throw error
      businessRows = (businesses || [])
      candidateBusinessIds = businessRows.map((b) => b.id)
    } else if (type === 'businesses') {
      const { data: businesses, error } = await supabase
        .from('businesses')
        .select('id, name, description, logo_url, address, city, phone, category_id')
        .ilike('name', `%${term}%`)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('name')
      if (error) throw error
      businessRows = (businesses || [])
      candidateBusinessIds = businessRows.map((b) => b.id)
      for (const b of businessRows) {
        matchSourcesByBusinessId[b.id] = [...(matchSourcesByBusinessId[b.id] || []), 'businesses']
      }
    } else if (type === 'services') {
      // Búsqueda por servicios ofrecidos por sedes de los negocios
      // 1) Encontrar servicios activos cuyo nombre coincide
      const { data: svcRows, error: svcErr } = await supabase
        .from('services')
        .select('id')
        .ilike('name', `%${term}%`)
        .eq('is_active', true)
      if (svcErr) throw svcErr
      const svcIds = (svcRows || []).map((s: any) => s.id)
      if (svcIds.length === 0) {
        return json({ businesses: [], locationsCountMap, total: 0 })
      }
      // 2) Tomar ofertas de servicios vinculadas a una sede (employee_services)
      //    Filtrar por ciudad/región (cityLocationIds) si existen para evitar resultados fuera de contexto
      let empSvcQuery = supabase
        .from('employee_services')
        .select('business_id, service_id, location_id, employee_id, is_active')
        .in('service_id', svcIds)
        .eq('is_active', true)

      if (cityLocationIds.length > 0) {
        // deno-lint-ignore no-explicit-any
        ;(empSvcQuery as any) = (empSvcQuery as any).in('location_id', cityLocationIds)
      }

      const { data: empSvcRows, error: esErr } = await empSvcQuery
      if (esErr) throw esErr

      candidateBusinessIds = Array.from(new Set((empSvcRows || []).map((es: any) => es.business_id))).filter(Boolean)
      if (candidateBusinessIds.length === 0) {
        return json({ businesses: [], locationsCountMap, total: 0 })
      }

      const { data: businesses, error: bizErr } = await supabase
        .from('businesses')
        .select('id, name, description, logo_url, address, city, phone, category_id')
        .in('id', candidateBusinessIds)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('name')
      if (bizErr) throw bizErr
      businessRows = (businesses || [])
      for (const es of empSvcRows || []) {
        const bid = (es as any).business_id
        if (bid) {
          matchSourcesByBusinessId[bid] = [...(matchSourcesByBusinessId[bid] || []), 'services']
        }
      }
    } else if (type === 'categories') {
      const { data: cats, error: catErr } = await supabase
        .from('business_categories')
        .select('id')
        .ilike('name', `%${term}%`)
        .eq('is_active', true)
      if (catErr) throw catErr
      const catIds = (cats || []).map((c: any) => c.id)
      if (catIds.length === 0) {
        return json({ businesses: [], locationsCountMap, total: 0 })
      }
      const { data: businesses, error: bizErr } = await supabase
        .from('businesses')
        .select('id, name, description, logo_url, address, city, phone, category_id')
        .in('category_id', catIds)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('name')
      if (bizErr) throw bizErr
      businessRows = (businesses || [])
      candidateBusinessIds = businessRows.map(b => b.id)
      for (const b of businessRows) {
        matchSourcesByBusinessId[b.id] = [...(matchSourcesByBusinessId[b.id] || []), 'categories']
      }
    } else if (type === 'users') {
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id')
        .ilike('full_name', `%${term}%`)
      if (profErr) throw profErr
      const employeeIds = (profiles || []).map((p: any) => p.id)
      if (employeeIds.length === 0) {
        return json({ businesses: [], locationsCountMap, total: 0 })
      }
      const { data: emp, error: empErr } = await supabase
        .from('business_employees')
        .select('business_id')
        .in('employee_id', employeeIds)
        .eq('status', 'approved')
        .eq('is_active', true)
      if (empErr) throw empErr
      candidateBusinessIds = Array.from(new Set((emp || []).map((e: any) => e.business_id))).filter(Boolean)
      const { data: businesses, error: bizErr } = await supabase
        .from('businesses')
        .select('id, name, description, logo_url, address, city, phone, category_id')
        .in('id', candidateBusinessIds)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('name')
      if (bizErr) throw bizErr
      businessRows = (businesses || [])
      for (const b of businessRows) {
        matchSourcesByBusinessId[b.id] = [...(matchSourcesByBusinessId[b.id] || []), 'users']
      }
    } else if (type === 'all') {
      // Buscar en todas las fuentes y unir resultados
      // 1) Por nombre de negocio
      const { data: bizByName } = await supabase
        .from('businesses')
        .select('id, name, description, logo_url, address, city, phone, category_id')
        .ilike('name', `%${term}%`)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('name')
      const setBiz = new Map<string, any>()
      for (const b of (bizByName || []) as any[]) {
        setBiz.set(b.id, b)
        matchSourcesByBusinessId[b.id] = [...(matchSourcesByBusinessId[b.id] || []), 'businesses']
      }
      // 2) Por servicios ofrecidos en sedes
      const { data: svcRows } = await supabase
        .from('services')
        .select('id')
        .ilike('name', `%${term}%`)
        .eq('is_active', true)
      const svcIds = (svcRows || []).map((s: any) => s.id)
      if (svcIds.length > 0) {
        let empSvcQuery = supabase
          .from('employee_services')
          .select('business_id, location_id, service_id, employee_id, is_active')
          .in('service_id', svcIds)
          .eq('is_active', true)
        if (cityLocationIds.length > 0) {
          // deno-lint-ignore no-explicit-any
          ;(empSvcQuery as any) = (empSvcQuery as any).in('location_id', cityLocationIds)
        }
        const { data: empSvcRows } = await empSvcQuery
        const svcBizIds = Array.from(new Set((empSvcRows || []).map((es: any) => es.business_id))).filter(Boolean)
        if (svcBizIds.length > 0) {
          const { data: svcBizRows } = await supabase
            .from('businesses')
            .select('id, name, description, logo_url, address, city, phone, category_id')
            .in('id', svcBizIds)
            .eq('is_active', true)
            .eq('is_public', true)
          for (const b of (svcBizRows || []) as any[]) {
            setBiz.set(b.id, b)
            matchSourcesByBusinessId[b.id] = [...(matchSourcesByBusinessId[b.id] || []), 'services']
          }
        }
      }
      // 3) Por categorías
      const { data: cats } = await supabase
        .from('business_categories')
        .select('id')
        .ilike('name', `%${term}%`)
        .eq('is_active', true)
      const catIds = (cats || []).map((c: any) => c.id)
      if (catIds.length > 0) {
        const { data: catBizRows } = await supabase
          .from('businesses')
          .select('id, name, description, logo_url, address, city, phone, category_id')
          .in('category_id', catIds)
          .eq('is_active', true)
          .eq('is_public', true)
        for (const b of (catBizRows || []) as any[]) {
          setBiz.set(b.id, b)
          matchSourcesByBusinessId[b.id] = [...(matchSourcesByBusinessId[b.id] || []), 'categories']
        }
      }
      // 4) Por profesionales
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .ilike('full_name', `%${term}%`)
      const employeeIds = (profiles || []).map((p: any) => p.id)
      if (employeeIds.length > 0) {
        const { data: emp } = await supabase
          .from('business_employees')
          .select('business_id')
          .in('employee_id', employeeIds)
          .eq('status', 'approved')
          .eq('is_active', true)
        const empBizIds = Array.from(new Set((emp || []).map((e: any) => e.business_id))).filter(Boolean)
        if (empBizIds.length > 0) {
          const { data: empBizRows } = await supabase
            .from('businesses')
            .select('id, name, description, logo_url, address, city, phone, category_id')
            .in('id', empBizIds)
            .eq('is_active', true)
            .eq('is_public', true)
          for (const b of (empBizRows || []) as any[]) {
            setBiz.set(b.id, b)
            matchSourcesByBusinessId[b.id] = [...(matchSourcesByBusinessId[b.id] || []), 'users']
          }
        }
      }
      businessRows = Array.from(setBiz.values())
      candidateBusinessIds = businessRows.map(b => b.id)
    } else if (type === 'categories') {
      // ya manejado arriba; esta rama se mantiene para compatibilidad en respuestas simples
      // se deja tal cual y se agrega orden y anotación
      const { data: cats2, error: catErr2 } = await supabase
        .from('business_categories')
        .select('id')
        .ilike('name', `%${term}%`)
        .eq('is_active', true)
      if (catErr2) throw catErr2
      const catIds2 = (cats2 || []).map((c: any) => c.id)
      if (catIds2.length === 0) {
        return json({ businesses: [], locationsCountMap, total: 0 })
      }
      const { data: businesses2, error: bizErr2 } = await supabase
        .from('businesses')
        .select('id, name, description, logo_url, address, city, phone, category_id')
        .in('category_id', catIds2)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('name')
      if (bizErr2) throw bizErr2
      businessRows = (businesses2 || [])
      candidateBusinessIds = businessRows.map(b => b.id)
      for (const b of businessRows) {
        matchSourcesByBusinessId[b.id] = [...(matchSourcesByBusinessId[b.id] || []), 'categories']
      }
    } else if (type === 'users') {
      // ya se manejó arriba en 'all'; aquí mantenemos la respuesta con anotación
      const { data: profiles2, error: profErr2 } = await supabase
        .from('profiles')
        .select('id')
        .ilike('full_name', `%${term}%`)
      if (profErr2) throw profErr2
      const employeeIds2 = (profiles2 || []).map((p: any) => p.id)
      if (employeeIds2.length === 0) {
        return json({ businesses: [], locationsCountMap, total: 0 })
      }
      const { data: emp2, error: empErr2 } = await supabase
        .from('business_employees')
        .select('business_id')
        .in('employee_id', employeeIds2)
        .eq('status', 'approved')
        .eq('is_active', true)
      if (empErr2) throw empErr2
      candidateBusinessIds = Array.from(new Set((emp2 || []).map((e: any) => e.business_id))).filter(Boolean)
      const { data: businesses3, error: bizErr3 } = await supabase
        .from('businesses')
        .select('id, name, description, logo_url, address, city, phone, category_id')
        .in('id', candidateBusinessIds)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('name')
      if (bizErr3) throw bizErr3
      businessRows = (businesses3 || [])
      for (const b of businessRows) {
        matchSourcesByBusinessId[b.id] = [...(matchSourcesByBusinessId[b.id] || []), 'users']
      }
    }

    // 3) Aplicar disponibilidad: servicios, ubicaciones y empleados activos asociados
    const businessIds = Array.from(new Set(businessRows.map((b) => b.id)))
    if (businessIds.length === 0) {
      return json({ businesses: [], locationsCountMap, total: 0 })
    }

    const [{ data: servicesRes }, { data: locationsRes }, { data: employeesRes }, { data: empServicesRes }] = await Promise.all([
      supabase.from('services').select('id, business_id').in('business_id', businessIds).eq('is_active', true),
      supabase.from('locations').select('id, business_id').in('business_id', businessIds).eq('is_active', true),
      supabase.from('business_employees').select('business_id, employee_id').in('business_id', businessIds).eq('status', 'approved').eq('is_active', true),
      supabase.from('employee_services').select('business_id, service_id, location_id, employee_id, is_active').in('business_id', businessIds).eq('is_active', true)
    ])

    const svcByBiz = new Map<string, Set<string>>()
    for (const s of servicesRes || []) {
      const bid = (s as any).business_id; const sid = (s as any).id
      if (!svcByBiz.has(bid)) svcByBiz.set(bid, new Set())
      svcByBiz.get(bid)!.add(sid)
    }
    const locByBiz = new Map<string, Set<string>>()
    for (const l of locationsRes || []) {
      const bid = (l as any).business_id; const lid = (l as any).id
      if (!locByBiz.has(bid)) locByBiz.set(bid, new Set())
      locByBiz.get(bid)!.add(lid)
    }
    const empByBiz = new Map<string, Set<string>>()
    for (const e of employeesRes || []) {
      const bid = (e as any).business_id; const eid = (e as any).employee_id
      if (!empByBiz.has(bid)) empByBiz.set(bid, new Set())
      empByBiz.get(bid)!.add(eid)
    }

    const allowedBusinessIds = new Set<string>()
    for (const es of empServicesRes || []) {
      const bid = (es as any).business_id
      const svc = svcByBiz.get(bid)
      const loc = locByBiz.get(bid)
      const emp = empByBiz.get(bid)
      if (!svc || !loc || !emp) continue
      const serviceOk = svc.has((es as any).service_id)
      const employeeOk = emp.has((es as any).employee_id)
      const hasSpecificLocation = Boolean((es as any).location_id) && loc.has((es as any).location_id)
      const hasAnyLocation = !Boolean((es as any).location_id) && loc.size > 0
      if (serviceOk && employeeOk && (hasSpecificLocation || hasAnyLocation)) {
        allowedBusinessIds.add(bid)
      }
    }

    // Nota: eliminamos el fallback del listado inicial.
    // Ahora, SIEMPRE exigimos que el negocio tenga al menos:
    // - una sede activa,
    // - un servicio activo,
    // - y al menos un empleado/profesional asignado a un servicio
    //   (vía employee_services) en alguna sede.

    // 4) Filtrar por ciudad (negocios que tienen sedes en la ciudad/región)
    const citySet = new Set(cityBusinessIds)
    const available = businessRows.filter(b => allowedBusinessIds.has(b.id))
    let cityOnly = available.filter(b => citySet.has(b.id))

    // Filtros de rating para búsquedas por término/servicios/categorías (aplican a todo el set)
    if (type !== 'initial' && (typeof minRating === 'number' || typeof minReviewCount === 'number')) {
      try {
        const ids = (cityOnly || []).map((b: any) => b.id)
        if (ids.length > 0) {
          const { data: statsRows } = await supabase
            .from('business_ratings_stats')
            .select('business_id, average_rating, review_count')
            .in('business_id', ids)
          const okSet = new Set<string>()
          for (const row of (statsRows || []) as any[]) {
            const avg = row.average_rating ?? 0
            const cnt = row.review_count ?? 0
            if ((typeof minRating !== 'number' || avg >= minRating) && (typeof minReviewCount !== 'number' || cnt >= minReviewCount)) {
              okSet.add(row.business_id)
            }
          }
          cityOnly = cityOnly.filter((b: any) => okSet.has(b.id))
        }
      } catch (_) {
        // Silencio: si falla stats, no aplicamos filtro adicional
      }
    }

    // Orden estable por nombre para resultados iniciales sin curación especial
    if (type === 'initial') {
      cityOnly = [...cityOnly].sort((a: any, b: any) => {
        const an = (a?.name || '').toLowerCase()
        const bn = (b?.name || '').toLowerCase()
        return an.localeCompare(bn)
      })
    }

    // Evitar duplicados entre páginas si el cliente envía IDs ya mostrados
    const totalOriginal = cityOnly.length
    const excludeSet = new Set(excludeBusinessIds || [])
    if (excludeSet.size > 0) {
      cityOnly = cityOnly.filter(b => !excludeSet.has(b.id))
    }

    // Paginación básica (sobre el conjunto filtrado)
    const start = Math.max(0, (page - 1) * pageSize)
    const end = start + pageSize
    const paginated = cityOnly.slice(start, end)

    // Rating stats para negocios paginados
    let ratingStatsByBusinessId: Record<string, { average_rating: number; review_count: number }> = {}
    try {
      const ids = (paginated || []).map((b: any) => b.id)
      if (ids.length > 0) {
        const { data: statsRows } = await supabase
          .from('business_ratings_stats')
          .select('business_id, average_rating, review_count')
          .in('business_id', ids)
        for (const row of (statsRows || []) as any[]) {
          ratingStatsByBusinessId[row.business_id] = {
            average_rating: row.average_rating ?? 0,
            review_count: row.review_count ?? 0,
          }
        }
      }
    } catch (_) {
      ratingStatsByBusinessId = {}
    }

    // Construir mapa de nombres de ciudad para IDs presentes en los negocios paginados
    let cityNameMap: Record<string, string> = {}
    try {
      const cityIds = Array.from(new Set((paginated || []).map((b: any) => b.city).filter((c: any) => typeof c === 'string')))
        .filter((cid) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cid))
      if (cityIds.length > 0) {
        const { data: cityRows } = await supabase
          .from('cities')
          .select('id, name')
          .in('id', cityIds)
        for (const row of (cityRows || []) as any[]) {
          cityNameMap[row.id] = row.name
        }
      }
    } catch (_) {
      // Silencio: no bloqueamos la respuesta si falla el catálogo
      cityNameMap = {}
    }

    // Reducir el mapa de fuentes a solo los negocios paginados (optimiza payload)
    const matchSourcesReduced: Record<string, string[]> = {}
    for (const b of paginated as any[]) {
      if (matchSourcesByBusinessId[b.id]) {
        matchSourcesReduced[b.id] = Array.from(new Set(matchSourcesByBusinessId[b.id]))
      }
    }

    return new Response(JSON.stringify({ businesses: paginated, total: totalOriginal, locationsCountMap, cityBusinessIds, cityLocationIds, cityNameMap, matchSourcesByBusinessId: matchSourcesReduced, ratingStatsByBusinessId }), { headers: corsHeaders })
  } catch (err) {
    console.error('search_businesses error', err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey' } })
  }
})

function json(payload: unknown) {
  return new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey' } })
}
