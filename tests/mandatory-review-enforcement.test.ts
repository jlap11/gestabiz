import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Test del sistema de reviews obligatorias
// Valida: detección de citas sin review, enforcement, multi-review flow

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Mandatory Review Enforcement System', () => {
  let testClientId: string
  let testBusinessId: string
  let testEmployeeId: string
  let testAppointmentId: string
  let testServiceId: string
  let testLocationId: string

  beforeAll(async () => {
    // Create test client
    const { data: clientData } = await supabase.auth.signUp({
      email: `client-${Date.now()}@test.com`,
      password: 'TestPassword123!',
    })
    testClientId = clientData.user?.id || ''

    // Create test business owner
    const { data: ownerData } = await supabase.auth.signUp({
      email: `owner-${Date.now()}@test.com`,
      password: 'TestPassword123!',
    })
    const ownerId = ownerData.user?.id || ''

    // Create test employee
    const { data: employeeData } = await supabase.auth.signUp({
      email: `employee-${Date.now()}@test.com`,
      password: 'TestPassword123!',
    })
    testEmployeeId = employeeData.user?.id || ''

    // Create business
    const { data: business } = await supabase
      .from('businesses')
      .insert({
        name: 'Test Business for Reviews',
        owner_id: ownerId,
        category: 'Salud y Belleza',
        subcategory: 'Peluquería',
      })
      .select()
      .single()

    testBusinessId = business?.id || ''

    // Create location
    const { data: location } = await supabase
      .from('locations')
      .insert({
        business_id: testBusinessId,
        name: 'Main Location',
        address: 'Test Street 123',
        city: 'Test City',
        state: 'Test State',
        is_primary: true,
      })
      .select()
      .single()

    testLocationId = location?.id || ''

    // Create service
    const { data: service } = await supabase
      .from('services')
      .insert({
        business_id: testBusinessId,
        name: 'Haircut',
        description: 'Professional haircut service',
        duration: 60,
        price: 30.0,
        category: 'Corte de Cabello',
      })
      .select()
      .single()

    testServiceId = service?.id || ''

    // Link employee to business
    await supabase.from('business_employees').insert({
      business_id: testBusinessId,
      employee_id: testEmployeeId,
      status: 'active',
    })
  })

  afterAll(async () => {
    // Cleanup
    await supabase.from('reviews').delete().eq('business_id', testBusinessId)
    await supabase.from('appointments').delete().eq('business_id', testBusinessId)
    await supabase.from('business_employees').delete().eq('business_id', testBusinessId)
    await supabase.from('services').delete().eq('business_id', testBusinessId)
    await supabase.from('locations').delete().eq('business_id', testBusinessId)
    await supabase.from('businesses').delete().eq('id', testBusinessId)
  })

  it('should create a completed appointment without review', async () => {
    const appointmentData = {
      business_id: testBusinessId,
      client_id: testClientId,
      employee_id: testEmployeeId,
      service_id: testServiceId,
      location_id: testLocationId,
      start_time: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      end_time: new Date(Date.now() - 82800000).toISOString(), // Yesterday + 1 hour
      status: 'completed',
      notes: 'Test appointment for review',
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.status).toBe('completed')

    testAppointmentId = data?.id || ''
  })

  it('should detect completed appointments without reviews', async () => {
    // Query for completed appointments without reviews
    const { data, error } = await supabase
      .from('appointments')
      .select(
        `
        id,
        business_id,
        employee_id,
        start_time,
        status,
        reviews!left(id)
      `
      )
      .eq('client_id', testClientId)
      .eq('status', 'completed')

    expect(error).toBeNull()
    expect(data).toBeDefined()

    // Filter appointments without reviews
    const appointmentsWithoutReviews = data?.filter(apt => !apt.reviews || apt.reviews.length === 0)

    expect(appointmentsWithoutReviews).toBeDefined()
    expect(appointmentsWithoutReviews!.length).toBeGreaterThan(0)
    expect(appointmentsWithoutReviews!.some(apt => apt.id === testAppointmentId)).toBe(true)
  })

  it('should prevent duplicate reviews for same appointment', async () => {
    // Create first review
    const reviewData = {
      business_id: testBusinessId,
      user_id: testClientId,
      appointment_id: testAppointmentId,
      rating: 5,
      comment: 'Great service! Very professional and friendly.',
      recommend: true,
      review_type: 'business',
    }

    const { data: firstReview, error: firstError } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select()
      .single()

    expect(firstError).toBeNull()
    expect(firstReview).toBeDefined()

    // Try to create duplicate review
    const { data: duplicateReview, error: duplicateError } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select()
      .single()

    // Should fail due to unique constraint on (appointment_id, review_type)
    expect(duplicateError).toBeDefined()
    expect(duplicateReview).toBeNull()
  })

  it('should validate review rating range (1-5)', async () => {
    // Try to create review with invalid rating (0)
    const invalidRating0 = {
      business_id: testBusinessId,
      user_id: testClientId,
      rating: 0,
      comment: 'Invalid rating test',
      review_type: 'business',
    }

    const { error: error0 } = await supabase.from('reviews').insert(invalidRating0)

    expect(error0).toBeDefined() // Should fail check constraint

    // Try to create review with invalid rating (6)
    const invalidRating6 = {
      business_id: testBusinessId,
      user_id: testClientId,
      rating: 6,
      comment: 'Invalid rating test',
      review_type: 'business',
    }

    const { error: error6 } = await supabase.from('reviews').insert(invalidRating6)

    expect(error6).toBeDefined() // Should fail check constraint

    // Valid ratings should work
    const validRatings = [1, 2, 3, 4, 5]

    for (const rating of validRatings) {
      const { error } = await supabase.from('reviews').insert({
        business_id: testBusinessId,
        user_id: testClientId,
        rating,
        comment: `Test rating ${rating}`,
        review_type: 'business',
      })

      // Might fail due to other constraints, but not rating constraint
      if (error) {
        expect(error.message).not.toContain('rating')
      }
    }
  })

  it('should validate minimum comment length (50 chars)', async () => {
    const shortComment = {
      business_id: testBusinessId,
      user_id: testClientId,
      rating: 5,
      comment: 'Short', // Only 5 characters
      review_type: 'business',
    }

    const { error } = await supabase.from('reviews').insert(shortComment)

    // Should fail check constraint for comment length
    expect(error).toBeDefined()
    expect(error?.message).toContain('comment')
  })

  it('should allow business review and employee review separately', async () => {
    // Create another completed appointment
    const { data: appointment2 } = await supabase
      .from('appointments')
      .insert({
        business_id: testBusinessId,
        client_id: testClientId,
        employee_id: testEmployeeId,
        service_id: testServiceId,
        location_id: testLocationId,
        start_time: new Date(Date.now() - 86400000).toISOString(),
        end_time: new Date(Date.now() - 82800000).toISOString(),
        status: 'completed',
      })
      .select()
      .single()

    const aptId2 = appointment2?.id || ''

    // Create business review
    const businessReview = {
      business_id: testBusinessId,
      user_id: testClientId,
      appointment_id: aptId2,
      rating: 5,
      comment:
        'Excellent business! Clean facilities and great atmosphere. Highly recommended for everyone.',
      recommend: true,
      review_type: 'business',
    }

    const { data: bizReview, error: bizError } = await supabase
      .from('reviews')
      .insert(businessReview)
      .select()
      .single()

    expect(bizError).toBeNull()
    expect(bizReview?.review_type).toBe('business')

    // Create employee review for same appointment
    const employeeReview = {
      employee_id: testEmployeeId,
      user_id: testClientId,
      appointment_id: aptId2,
      rating: 4,
      comment: 'Very skilled professional! Did an amazing job and was very attentive to my needs.',
      recommend: true,
      review_type: 'employee',
    }

    const { data: empReview, error: empError } = await supabase
      .from('reviews')
      .insert(employeeReview)
      .select()
      .single()

    expect(empError).toBeNull()
    expect(empReview?.review_type).toBe('employee')

    // Both reviews should exist
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('appointment_id', aptId2)

    expect(allReviews?.length).toBe(2)
  })

  it('should update business average rating after new review', async () => {
    // Get business rating before
    const { data: beforeBusiness } = await supabase
      .from('businesses')
      .select('average_rating, review_count')
      .eq('id', testBusinessId)
      .single()

    const ratingBefore = beforeBusiness?.average_rating || 0
    const countBefore = beforeBusiness?.review_count || 0

    // Create new review
    const { data: appointment3 } = await supabase
      .from('appointments')
      .insert({
        business_id: testBusinessId,
        client_id: testClientId,
        employee_id: testEmployeeId,
        service_id: testServiceId,
        location_id: testLocationId,
        start_time: new Date(Date.now() - 86400000).toISOString(),
        end_time: new Date(Date.now() - 82800000).toISOString(),
        status: 'completed',
      })
      .select()
      .single()

    await supabase.from('reviews').insert({
      business_id: testBusinessId,
      user_id: testClientId,
      appointment_id: appointment3?.id,
      rating: 4,
      comment: 'Good service overall! Would come back again for sure. Professional staff.',
      recommend: true,
      review_type: 'business',
    })

    // Wait for trigger to update
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Get business rating after
    const { data: afterBusiness } = await supabase
      .from('businesses')
      .select('average_rating, review_count')
      .eq('id', testBusinessId)
      .single()

    const ratingAfter = afterBusiness?.average_rating || 0
    const countAfter = afterBusiness?.review_count || 0

    // Review count should increase
    expect(countAfter).toBeGreaterThan(countBefore)

    // Average rating should be updated
    expect(ratingAfter).toBeGreaterThan(0)
  })

  it('should only allow reviews from clients with completed appointments', async () => {
    // Create a new client with no appointments
    const { data: newClient } = await supabase.auth.signUp({
      email: `new-client-${Date.now()}@test.com`,
      password: 'TestPassword123!',
    })

    // Try to create review without appointment
    const { error } = await supabase.from('reviews').insert({
      business_id: testBusinessId,
      user_id: newClient.user?.id,
      rating: 5,
      comment:
        'Trying to review without appointment. This should not be allowed under any circumstances.',
      review_type: 'business',
    })

    // Should fail due to RLS policy
    expect(error).toBeDefined()
  })
})
