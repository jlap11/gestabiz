import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Test del flujo completo de vacantes laborales
// Cubre: create vacancy → apply → accept → verify notifications

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// ⚠️ TESTS TEMPORALMENTE DESHABILITADOS
// Razón: Requieren service_role key para bypass RLS y evitar envío de emails
// Ver: docs/CONFIGURACION_TESTS_E2E.md para instrucciones de configuración
describe.skip('Job Vacancy Complete Flow E2E', () => {
  let testBusinessId: string
  let testVacancyId: string
  let testApplicantId: string
  let testApplicationId: string
  let testOwnerId: string
  let testProfileId: string

  beforeAll(async () => {
    // ⚠️ IMPORTANTE: No usar auth.signUp para evitar envío de emails
    // Crear usuarios directamente en auth.users requiere service_role key
    // Por ahora, usar UUIDs fijos y crear solo los registros necesarios

    // Generate fixed UUIDs for test users (no email sending)
    testOwnerId = '00000000-0000-0000-0000-000000000001'
    testApplicantId = '00000000-0000-0000-0000-000000000002'

    console.log('Using mock user IDs:', { testOwnerId, testApplicantId })

    // Create test business (using real category_id from business_categories table)
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name: 'Test Business for Vacancies',
        owner_id: testOwnerId,
        category_id: '8c792eef-4646-4b12-a7d0-0cae11a56d77', // Consultoría subcategory
      })
      .select()
      .single()

    if (businessError) throw new Error(`Business creation failed: ${businessError.message}`)
    if (!business) throw new Error('Business not created')

    testBusinessId = business.id
    console.log('Business created:', testBusinessId)
  })

  afterAll(async () => {
    // Cleanup: Delete test data
    if (testApplicationId) {
      await supabase.from('job_applications').delete().eq('id', testApplicationId)
    }
    if (testVacancyId) {
      await supabase.from('job_vacancies').delete().eq('id', testVacancyId)
    }
    if (testBusinessId) {
      await supabase.from('businesses').delete().eq('id', testBusinessId)
    }
    if (testOwnerId) {
      await supabase.auth.admin.deleteUser(testOwnerId)
    }
    if (testApplicantId) {
      await supabase.auth.admin.deleteUser(testApplicantId)
    }
  })

  it('should create a job vacancy successfully', async () => {
    const vacancyData = {
      business_id: testBusinessId,
      title: 'Senior React Developer',
      description: 'Looking for an experienced React developer',
      position_type: 'full_time',
      experience_level: 'senior',
      salary_min: 50000,
      salary_max: 80000,
      requirements: ['5+ years React', 'TypeScript', 'Testing'],
      responsibilities: ['Lead development', 'Code review', 'Mentoring'],
      benefits: ['Remote work', 'Health insurance', 'Flexible hours'],
      work_schedule: {
        monday: { enabled: true, start_time: '09:00', end_time: '18:00' },
        tuesday: { enabled: true, start_time: '09:00', end_time: '18:00' },
        wednesday: { enabled: true, start_time: '09:00', end_time: '18:00' },
        thursday: { enabled: true, start_time: '09:00', end_time: '18:00' },
        friday: { enabled: true, start_time: '09:00', end_time: '18:00' },
        saturday: { enabled: false },
        sunday: { enabled: false },
      },
      location: {
        type: 'remote',
        city: 'Any',
        address: 'Remote',
      },
      status: 'open',
      slots: 3,
    }

    const { data, error } = await supabase
      .from('job_vacancies')
      .insert(vacancyData)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.title).toBe('Senior React Developer')
    expect(data?.status).toBe('open')
    expect(data?.slots).toBe(3)
    expect(data?.applications_count).toBe(0)

    testVacancyId = data?.id || ''
  })

  it('should create employee profile for applicant', async () => {
    // ⚠️ Skip auth - usar UUID fijo directamente
    // No hacer signInWithPassword para evitar envío de emails

    const profileData = {
      user_id: testApplicantId,
      professional_summary: 'Experienced React developer with 7 years of experience',
      years_of_experience: 7,
      specializations: ['React', 'TypeScript', 'Node.js'],
      languages: ['English', 'Spanish'],
      certifications: [
        {
          id: crypto.randomUUID(),
          name: 'AWS Certified Developer',
          issuer: 'Amazon',
          date: '2023-01-15',
          expires: '2026-01-15',
          url: 'https://aws.amazon.com/certification',
        },
      ],
      available_for_hire: true,
      preferred_work_type: 'full_time',
      expected_salary_min: 55000,
      expected_salary_max: 85000,
    }

    const { data, error } = await supabase
      .from('employee_profiles')
      .upsert(profileData)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.years_of_experience).toBe(7)
    expect(data?.specializations).toContain('React')
  })

  it('should calculate match score correctly via RPC', async () => {
    const { data, error } = await supabase.rpc('get_matching_vacancies', {
      p_user_id: testApplicantId,
      p_limit: 10,
    })

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(Array.isArray(data)).toBe(true)

    // Find our test vacancy
    const matchingVacancy = data?.find((v: any) => v.id === testVacancyId)
    expect(matchingVacancy).toBeDefined()
    expect(matchingVacancy?.match_score).toBeGreaterThan(0)
    expect(matchingVacancy?.match_score).toBeLessThanOrEqual(100)

    // Verify score is reasonable (should be high due to matching specializations)
    expect(matchingVacancy?.match_score).toBeGreaterThan(50)
  })

  it('should submit job application successfully', async () => {
    const applicationData = {
      vacancy_id: testVacancyId,
      user_id: testApplicantId,
      cover_letter:
        'I am very interested in this position and believe my 7 years of React experience make me a great fit.',
      status: 'pending',
      availability: {
        monday: { enabled: true, start_time: '09:00', end_time: '18:00' },
        tuesday: { enabled: true, start_time: '09:00', end_time: '18:00' },
        wednesday: { enabled: true, start_time: '09:00', end_time: '18:00' },
        thursday: { enabled: true, start_time: '09:00', end_time: '18:00' },
        friday: { enabled: true, start_time: '09:00', end_time: '18:00' },
        saturday: { enabled: false },
        sunday: { enabled: false },
      },
    }

    const { data, error } = await supabase
      .from('job_applications')
      .insert(applicationData)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.status).toBe('pending')
    expect(data?.vacancy_id).toBe(testVacancyId)

    testApplicationId = data?.id || ''
  })

  it('should create in-app notification after application (trigger test)', async () => {
    // Wait a bit for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if notification was created
    const { data, error } = await supabase
      .from('in_app_notifications')
      .select('*')
      .eq('user_id', testOwnerId)
      .eq('type', 'job_application')
      .order('created_at', { ascending: false })
      .limit(1)

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.[0]).toBeDefined()
    expect(data?.[0]?.type).toBe('job_application')
    expect(data?.[0]?.is_read).toBe(false)

    // Verify metadata
    const metadata = data?.[0]?.metadata
    expect(metadata?.application_id).toBe(testApplicationId)
    expect(metadata?.vacancy_id).toBe(testVacancyId)
    expect(metadata?.applicant_id).toBe(testApplicantId)
    expect(metadata?.status).toBe('pending')
  })

  it('should update vacancy applications_count after application', async () => {
    const { data, error } = await supabase
      .from('job_vacancies')
      .select('applications_count')
      .eq('id', testVacancyId)
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.applications_count).toBe(1)
  })

  it('should accept application successfully', async () => {
    // ⚠️ Skip auth - usar UUID fijo directamente
    // No hacer signInWithPassword para evitar envío de emails

    const { data, error } = await supabase
      .from('job_applications')
      .update({ status: 'accepted' })
      .eq('id', testApplicationId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.status).toBe('accepted')
  })

  it('should auto-close vacancy when slots filled', async () => {
    // Create 2 more applications to fill all 3 slots
    for (let i = 0; i < 2; i++) {
      const { data: applicant } = await supabase.auth.signUp({
        email: `applicant-${Date.now()}-${i}@test.com`,
        password: 'TestPassword123!',
      })

      await supabase.from('job_applications').insert({
        vacancy_id: testVacancyId,
        user_id: applicant.user?.id,
        cover_letter: 'Test application',
        status: 'accepted',
      })
    }

    // Wait for trigger to update applications_count
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if vacancy is closed
    const { data, error } = await supabase
      .from('job_vacancies')
      .select('status, applications_count')
      .eq('id', testVacancyId)
      .single()

    expect(error).toBeNull()
    expect(data?.applications_count).toBe(3)
    expect(data?.status).toBe('filled')
  })

  it('should not allow new applications to filled vacancy', async () => {
    const { data: newApplicant } = await supabase.auth.signUp({
      email: `blocked-applicant-${Date.now()}@test.com`,
      password: 'TestPassword123!',
    })

    const { error } = await supabase.from('job_applications').insert({
      vacancy_id: testVacancyId,
      user_id: newApplicant.user?.id,
      cover_letter: 'This should fail',
      status: 'pending',
    })

    // Should fail due to RLS policy or trigger validation
    expect(error).toBeDefined()
  })
})
