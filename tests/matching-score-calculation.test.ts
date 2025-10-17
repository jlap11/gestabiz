import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Test del algoritmo de matching score (RPC get_matching_vacancies)
// Valida: cálculo de score 0-100, componentes del score, ranking

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

interface MatchingVacancy {
  id: string
  title: string
  match_score: number
  business_id: string
  position_type: string
  experience_level: string
}

describe('Matching Score Calculation Algorithm', () => {
  let testBusinessId: string
  let testUserId: string
  let testVacancies: { high: string; medium: string; low: string } = {
    high: '',
    medium: '',
    low: '',
  }

  beforeAll(async () => {
    // Create test user
    const { data: userData } = await supabase.auth.signUp({
      email: `test-user-${Date.now()}@test.com`,
      password: 'TestPassword123!',
    })
    testUserId = userData.user?.id || ''

    // Create test business
    const { data: business } = await supabase
      .from('businesses')
      .insert({
        name: 'Test Business for Matching',
        owner_id: testUserId,
        category: 'Technology',
        subcategory: 'Software Development',
      })
      .select()
      .single()

    testBusinessId = business?.id || ''

    // Create employee profile with specific skills
    await supabase.from('employee_profiles').upsert({
      user_id: testUserId,
      professional_summary: 'Full-stack developer with React and Node.js expertise',
      years_of_experience: 5,
      specializations: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      languages: ['English', 'Spanish'],
      available_for_hire: true,
      preferred_work_type: 'full_time',
      expected_salary_min: 50000,
      expected_salary_max: 70000,
    })

    // Create 3 vacancies with different match levels
    
    // HIGH MATCH: Perfect alignment with user profile
    const { data: highMatch } = await supabase
      .from('job_vacancies')
      .insert({
        business_id: testBusinessId,
        title: 'Senior Full-Stack Developer',
        description: 'React and Node.js expert needed',
        position_type: 'full_time',
        experience_level: 'senior',
        salary_min: 55000,
        salary_max: 75000,
        requirements: ['React', 'Node.js', 'TypeScript'],
        status: 'open',
        slots: 2,
      })
      .select()
      .single()

    testVacancies.high = highMatch?.id || ''

    // MEDIUM MATCH: Partial alignment
    const { data: mediumMatch } = await supabase
      .from('job_vacancies')
      .insert({
        business_id: testBusinessId,
        title: 'React Frontend Developer',
        description: 'Frontend specialist for React projects',
        position_type: 'full_time',
        experience_level: 'mid',
        salary_min: 40000,
        salary_max: 60000,
        requirements: ['React', 'CSS', 'JavaScript'],
        status: 'open',
        slots: 1,
      })
      .select()
      .single()

    testVacancies.medium = mediumMatch?.id || ''

    // LOW MATCH: Poor alignment
    const { data: lowMatch } = await supabase
      .from('job_vacancies')
      .insert({
        business_id: testBusinessId,
        title: 'Python Backend Developer',
        description: 'Python and Django expert needed',
        position_type: 'part_time',
        experience_level: 'junior',
        salary_min: 30000,
        salary_max: 45000,
        requirements: ['Python', 'Django', 'REST API'],
        status: 'open',
        slots: 1,
      })
      .select()
      .single()

    testVacancies.low = lowMatch?.id || ''
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('job_vacancies').delete().in('id', Object.values(testVacancies))
    await supabase.from('employee_profiles').delete().eq('user_id', testUserId)
    await supabase.from('businesses').delete().eq('id', testBusinessId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  it('should return matching vacancies via RPC', async () => {
    const { data, error } = await supabase.rpc('get_matching_vacancies', {
      p_user_id: testUserId,
      p_limit: 10,
    })

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
  })

  it('should calculate scores in valid range (0-100)', async () => {
    const { data } = await supabase.rpc('get_matching_vacancies', {
      p_user_id: testUserId,
      p_limit: 10,
    })

    expect(data).toBeDefined()

    data?.forEach((vacancy: MatchingVacancy) => {
      expect(vacancy.match_score).toBeGreaterThanOrEqual(0)
      expect(vacancy.match_score).toBeLessThanOrEqual(100)
      expect(Number.isFinite(vacancy.match_score)).toBe(true)
    })
  })

  it('should rank high-match vacancy highest', async () => {
    const { data } = await supabase.rpc('get_matching_vacancies', {
      p_user_id: testUserId,
      p_limit: 10,
    })

    const highVacancy = data?.find((v: MatchingVacancy) => v.id === testVacancies.high)
    const mediumVacancy = data?.find((v: MatchingVacancy) => v.id === testVacancies.medium)
    const lowVacancy = data?.find((v: MatchingVacancy) => v.id === testVacancies.low)

    expect(highVacancy).toBeDefined()
    expect(mediumVacancy).toBeDefined()
    expect(lowVacancy).toBeDefined()

    // High match should have highest score
    expect(highVacancy!.match_score).toBeGreaterThan(mediumVacancy!.match_score)
    expect(highVacancy!.match_score).toBeGreaterThan(lowVacancy!.match_score)

    // Medium match should be between high and low
    expect(mediumVacancy!.match_score).toBeGreaterThan(lowVacancy!.match_score)
  })

  it('should consider specializations in score', async () => {
    const { data } = await supabase.rpc('get_matching_vacancies', {
      p_user_id: testUserId,
      p_limit: 10,
    })

    const highVacancy = data?.find((v: MatchingVacancy) => v.id === testVacancies.high)
    const lowVacancy = data?.find((v: MatchingVacancy) => v.id === testVacancies.low)

    // High vacancy requires React, Node.js, TypeScript (3/4 match)
    // Low vacancy requires Python, Django, REST API (0/4 match)
    expect(highVacancy!.match_score).toBeGreaterThan(70)
    expect(lowVacancy!.match_score).toBeLessThan(40)
  })

  it('should consider experience level in score', async () => {
    const { data } = await supabase.rpc('get_matching_vacancies', {
      p_user_id: testUserId,
      p_limit: 10,
    })

    const seniorVacancy = data?.find((v: MatchingVacancy) => v.id === testVacancies.high)
    const juniorVacancy = data?.find((v: MatchingVacancy) => v.id === testVacancies.low)

    // User has 5 years experience (senior level)
    // Senior vacancy should match better than junior
    expect(seniorVacancy!.match_score).toBeGreaterThan(juniorVacancy!.match_score)
  })

  it('should consider salary expectations in score', async () => {
    const { data } = await supabase.rpc('get_matching_vacancies', {
      p_user_id: testUserId,
      p_limit: 10,
    })

    const highSalary = data?.find((v: MatchingVacancy) => v.id === testVacancies.high)
    const lowSalary = data?.find((v: MatchingVacancy) => v.id === testVacancies.low)

    // User expects 50k-70k
    // High vacancy offers 55k-75k (good overlap)
    // Low vacancy offers 30k-45k (poor overlap)
    expect(highSalary!.match_score).toBeGreaterThan(lowSalary!.match_score)
  })

  it('should consider position type preference in score', async () => {
    const { data } = await supabase.rpc('get_matching_vacancies', {
      p_user_id: testUserId,
      p_limit: 10,
    })

    const fullTime = data?.find((v: MatchingVacancy) => v.id === testVacancies.high)
    const partTime = data?.find((v: MatchingVacancy) => v.id === testVacancies.low)

    // User prefers full_time
    expect(fullTime!.match_score).toBeGreaterThan(partTime!.match_score)
  })

  it('should return vacancies in descending order by score', async () => {
    const { data } = await supabase.rpc('get_matching_vacancies', {
      p_user_id: testUserId,
      p_limit: 10,
    })

    expect(data).toBeDefined()
    expect(data!.length).toBeGreaterThan(1)

    // Verify scores are in descending order
    for (let i = 0; i < data!.length - 1; i++) {
      expect(data![i].match_score).toBeGreaterThanOrEqual(data![i + 1].match_score)
    }
  })

  it('should respect limit parameter', async () => {
    const { data: limited } = await supabase.rpc('get_matching_vacancies', {
      p_user_id: testUserId,
      p_limit: 2,
    })

    expect(limited).toBeDefined()
    expect(limited!.length).toBeLessThanOrEqual(2)
  })

  it('should return empty array for user without profile', async () => {
    const { data: newUser } = await supabase.auth.signUp({
      email: `no-profile-${Date.now()}@test.com`,
      password: 'TestPassword123!',
    })

    const { data } = await supabase.rpc('get_matching_vacancies', {
      p_user_id: newUser.user?.id,
      p_limit: 10,
    })

    expect(data).toBeDefined()
    expect(Array.isArray(data)).toBe(true)
    expect(data!.length).toBe(0)
  })

  it('should only return open vacancies', async () => {
    // Close one vacancy
    await supabase
      .from('job_vacancies')
      .update({ status: 'closed' })
      .eq('id', testVacancies.low)

    const { data } = await supabase.rpc('get_matching_vacancies', {
      p_user_id: testUserId,
      p_limit: 10,
    })

    const closedVacancy = data?.find((v: MatchingVacancy) => v.id === testVacancies.low)
    expect(closedVacancy).toBeUndefined()

    // Reopen for cleanup
    await supabase
      .from('job_vacancies')
      .update({ status: 'open' })
      .eq('id', testVacancies.low)
  })
})
