import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import 'dotenv/config'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const OUTPUT_DIR = path.join(process.cwd(), 'generated-data')

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function arrayToCSV(headers: string[], rows: any[][]): string {
  const csvRows = [headers.map(escapeCSV).join(',')]
  for (const row of rows) {
    csvRows.push(row.map(escapeCSV).join(','))
  }
  return csvRows.join('\n')
}

async function exportAllData() {
  console.log('🚀 Exportando todos los datos a CSV...\n')

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // 1. PROPIETARIOS (owners)
  console.log('📋 Exportando propietarios...')
  const { data: owners } = await supabase
    .from('businesses')
    .select('owner_id, profiles!businesses_owner_id_fkey(full_name, email, phone)')
    .order('created_at')

  if (owners) {
    const uniqueOwners = Array.from(
      new Map(owners.map(o => [(o as any).profiles.email, o])).values()
    )

    const ownerRows = uniqueOwners.map(o => {
      const profile = (o as any).profiles
      return [profile.email, profile.full_name, profile.phone, o.owner_id]
    })

    const ownersCSV = arrayToCSV(['email', 'nombre_completo', 'telefono', 'user_id'], ownerRows)

    fs.writeFileSync(path.join(OUTPUT_DIR, '3-propietarios.csv'), ownersCSV, 'utf8')
    console.log(`✅ ${uniqueOwners.length} propietarios exportados\n`)
  }

  // 2. EMPLEADOS
  console.log('📋 Exportando empleados...')
  const { data: employees } = await supabase
    .from('business_employees')
    .select(
      'employee_id, profiles!business_employees_employee_id_fkey(full_name, email, phone), businesses(name)'
    )
    .order('employee_id')

  if (employees) {
    const employeeMap = new Map()

    for (const emp of employees) {
      const profile = (emp as any).profiles
      const business = (emp as any).businesses

      if (!employeeMap.has(profile.email)) {
        employeeMap.set(profile.email, {
          email: profile.email,
          full_name: profile.full_name,
          phone: profile.phone,
          user_id: emp.employee_id,
          businesses: [],
        })
      }

      employeeMap.get(profile.email).businesses.push(business.name)
    }

    const employeeRows = Array.from(employeeMap.values()).map(e => [
      e.email,
      e.full_name,
      e.phone,
      e.user_id,
      e.businesses.join(' | '),
    ])

    const employeesCSV = arrayToCSV(
      ['email', 'nombre_completo', 'telefono', 'user_id', 'negocios'],
      employeeRows
    )

    fs.writeFileSync(path.join(OUTPUT_DIR, '4-empleados.csv'), employeesCSV, 'utf8')
    console.log(`✅ ${employeeRows.length} empleados exportados\n`)
  }

  // 3. CLIENTES (usuarios que no son owners ni employees)
  console.log('📋 Exportando clientes...')
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone')
    .order('created_at')

  const { data: empList } = await supabase.from('business_employees').select('employee_id')

  const { data: ownerList } = await supabase.from('businesses').select('owner_id')

  if (allUsers && empList && ownerList) {
    const empIds = new Set(empList.map(e => e.employee_id))
    const ownerIds = new Set(ownerList.map(o => o.owner_id))

    const clients = allUsers.filter(u => !empIds.has(u.id) && !ownerIds.has(u.id))

    const clientRows = clients.map(c => [c.email, c.full_name, c.phone, c.id])

    const clientsCSV = arrayToCSV(['email', 'nombre_completo', 'telefono', 'user_id'], clientRows)

    fs.writeFileSync(path.join(OUTPUT_DIR, '5-clientes.csv'), clientsCSV, 'utf8')
    console.log(`✅ ${clients.length} clientes exportados\n`)
  }

  // 4. NEGOCIOS
  console.log('📋 Exportando negocios...')
  const { data: businesses } = await supabase
    .from('businesses')
    .select(
      'name, slug, category, city, state, profiles!businesses_owner_id_fkey(full_name, email)'
    )
    .order('created_at')

  if (businesses) {
    const businessRows = businesses.map(b => {
      const owner = (b as any).profiles
      return [b.name, b.slug, b.category, b.city, b.state, owner.full_name, owner.email]
    })

    const businessesCSV = arrayToCSV(
      ['nombre', 'slug', 'categoria', 'ciudad', 'departamento', 'propietario', 'email_propietario'],
      businessRows
    )

    fs.writeFileSync(path.join(OUTPUT_DIR, '6-negocios.csv'), businessesCSV, 'utf8')
    console.log(`✅ ${businesses.length} negocios exportados\n`)
  }

  // 5. SEDES
  console.log('📋 Exportando sedes...')
  const { data: locations } = await supabase
    .from('locations')
    .select('name, address, city, state, opens_at, closes_at, businesses(name)')
    .order('created_at')

  if (locations) {
    const locationRows = locations.map(l => {
      const business = (l as any).businesses
      return [l.name, l.address, l.city, l.state, l.opens_at, l.closes_at, business.name]
    })

    const locationsCSV = arrayToCSV(
      ['nombre', 'direccion', 'ciudad', 'departamento', 'apertura', 'cierre', 'negocio'],
      locationRows
    )

    fs.writeFileSync(path.join(OUTPUT_DIR, '7-sedes.csv'), locationsCSV, 'utf8')
    console.log(`✅ ${locations.length} sedes exportadas\n`)
  }

  // 6. SERVICIOS
  console.log('📋 Exportando servicios...')
  const { data: services } = await supabase
    .from('services')
    .select('name, description, duration_minutes, price, currency, category, businesses(name)')
    .order('created_at')

  if (services) {
    const serviceRows = services.map(s => {
      const business = (s as any).businesses
      return [
        s.name,
        s.description || '',
        s.duration_minutes,
        s.price,
        s.currency,
        s.category,
        business.name,
      ]
    })

    const servicesCSV = arrayToCSV(
      ['nombre', 'descripcion', 'duracion_minutos', 'precio', 'moneda', 'categoria', 'negocio'],
      serviceRows
    )

    fs.writeFileSync(path.join(OUTPUT_DIR, '8-servicios.csv'), servicesCSV, 'utf8')
    console.log(`✅ ${services.length} servicios exportados\n`)
  }

  // 7. CITAS
  console.log('📋 Exportando citas...')
  const { data: appointments } = await supabase
    .from('appointments')
    .select(
      `
      start_time, end_time, status, price, currency, payment_status,
      businesses(name),
      services(name),
      client:profiles!appointments_client_id_fkey(full_name, email),
      employee:profiles!appointments_employee_id_fkey(full_name)
    `
    )
    .order('start_time', { ascending: false })

  if (appointments) {
    const appointmentRows = appointments.map((a: any) => [
      new Date(a.start_time).toLocaleString('es-CO'),
      new Date(a.end_time).toLocaleString('es-CO'),
      a.status,
      a.price,
      a.currency,
      a.payment_status,
      a.businesses.name,
      a.services.name,
      a.client.full_name,
      a.client.email,
      a.employee?.full_name || 'Sin asignar',
    ])

    const appointmentsCSV = arrayToCSV(
      [
        'inicio',
        'fin',
        'estado',
        'precio',
        'moneda',
        'pago',
        'negocio',
        'servicio',
        'cliente',
        'email_cliente',
        'empleado',
      ],
      appointmentRows
    )

    fs.writeFileSync(path.join(OUTPUT_DIR, '9-citas.csv'), appointmentsCSV, 'utf8')
    console.log(`✅ ${appointments.length} citas exportadas\n`)
  }

  // 8. TRANSACCIONES
  console.log('📋 Exportando transacciones...')
  const { data: transactions } = await supabase
    .from('transactions')
    .select(
      'transaction_date, type, category, amount, currency, description, payment_method, businesses(name)'
    )
    .order('transaction_date', { ascending: false })

  if (transactions) {
    const transactionRows = transactions.map((t: any) => [
      t.transaction_date,
      t.type,
      t.category,
      t.amount,
      t.currency,
      t.description || '',
      t.payment_method || '',
      t.businesses.name,
    ])

    const transactionsCSV = arrayToCSV(
      ['fecha', 'tipo', 'categoria', 'monto', 'moneda', 'descripcion', 'metodo_pago', 'negocio'],
      transactionRows
    )

    fs.writeFileSync(path.join(OUTPUT_DIR, '10-transacciones.csv'), transactionsCSV, 'utf8')
    console.log(`✅ ${transactions.length} transacciones exportadas\n`)
  }

  console.log('🎉 ¡Exportación completada!')
  console.log(`📁 Archivos guardados en: ${OUTPUT_DIR}`)
}

exportAllData()
