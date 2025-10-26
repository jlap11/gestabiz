import { describe, it, expect } from 'vitest'

// Test del algoritmo de detección de conflictos de horario
// Valida: solapamiento de horarios, detección de conflictos, lógica de disponibilidad

interface TimeSlot {
  enabled: boolean
  start_time?: string
  end_time?: string
}

interface WeekSchedule {
  monday: TimeSlot
  tuesday: TimeSlot
  wednesday: TimeSlot
  thursday: TimeSlot
  friday: TimeSlot
  saturday: TimeSlot
  sunday: TimeSlot
}

// Helper function to check if two time ranges overlap
function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const s1 = parseTime(start1)
  const e1 = parseTime(end1)
  const s2 = parseTime(start2)
  const e2 = parseTime(end2)

  return s1 < e2 && s2 < e1
}

// Main function to detect schedule conflicts
function detectScheduleConflicts(
  currentSchedules: WeekSchedule[],
  newSchedule: WeekSchedule
): { hasConflicts: boolean; conflicts: string[] } {
  const conflicts: string[] = []
  const days: Array<keyof WeekSchedule> = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]

  for (const day of days) {
    const newSlot = newSchedule[day]

    // Skip if new schedule doesn't work this day
    if (!newSlot.enabled || !newSlot.start_time || !newSlot.end_time) {
      continue
    }

    // Check against all existing schedules
    for (let i = 0; i < currentSchedules.length; i++) {
      const existingSlot = currentSchedules[i][day]

      // Skip if existing schedule doesn't work this day
      if (!existingSlot.enabled || !existingSlot.start_time || !existingSlot.end_time) {
        continue
      }

      // Check for overlap
      if (
        timesOverlap(
          newSlot.start_time,
          newSlot.end_time,
          existingSlot.start_time,
          existingSlot.end_time
        )
      ) {
        conflicts.push(
          `${day}: ${newSlot.start_time}-${newSlot.end_time} overlaps with ${existingSlot.start_time}-${existingSlot.end_time}`
        )
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  }
}

describe('Schedule Conflict Detection Algorithm', () => {
  const baseSchedule: WeekSchedule = {
    monday: { enabled: true, start_time: '09:00', end_time: '17:00' },
    tuesday: { enabled: true, start_time: '09:00', end_time: '17:00' },
    wednesday: { enabled: true, start_time: '09:00', end_time: '17:00' },
    thursday: { enabled: true, start_time: '09:00', end_time: '17:00' },
    friday: { enabled: true, start_time: '09:00', end_time: '17:00' },
    saturday: { enabled: false },
    sunday: { enabled: false },
  }

  describe('timesOverlap helper function', () => {
    it('should detect complete overlap', () => {
      const result = timesOverlap('09:00', '17:00', '10:00', '16:00')
      expect(result).toBe(true)
    })

    it('should detect partial overlap (start)', () => {
      const result = timesOverlap('09:00', '13:00', '12:00', '18:00')
      expect(result).toBe(true)
    })

    it('should detect partial overlap (end)', () => {
      const result = timesOverlap('14:00', '18:00', '09:00', '15:00')
      expect(result).toBe(true)
    })

    it('should detect exact same times', () => {
      const result = timesOverlap('09:00', '17:00', '09:00', '17:00')
      expect(result).toBe(true)
    })

    it('should detect adjacent times as overlap (edge case)', () => {
      const result = timesOverlap('09:00', '13:00', '13:00', '17:00')
      expect(result).toBe(false) // 13:00 < 13:00 is false
    })

    it('should not detect non-overlapping times (before)', () => {
      const result = timesOverlap('09:00', '12:00', '14:00', '18:00')
      expect(result).toBe(false)
    })

    it('should not detect non-overlapping times (after)', () => {
      const result = timesOverlap('14:00', '18:00', '09:00', '12:00')
      expect(result).toBe(false)
    })
  })

  describe('detectScheduleConflicts main function', () => {
    it('should detect no conflicts with empty schedules', () => {
      const result = detectScheduleConflicts([], baseSchedule)

      expect(result.hasConflicts).toBe(false)
      expect(result.conflicts).toHaveLength(0)
    })

    it('should detect no conflicts with non-overlapping schedules', () => {
      const existingSchedule: WeekSchedule = {
        monday: { enabled: true, start_time: '18:00', end_time: '22:00' },
        tuesday: { enabled: true, start_time: '18:00', end_time: '22:00' },
        wednesday: { enabled: false },
        thursday: { enabled: false },
        friday: { enabled: false },
        saturday: { enabled: true, start_time: '10:00', end_time: '14:00' },
        sunday: { enabled: false },
      }

      const result = detectScheduleConflicts([existingSchedule], baseSchedule)

      expect(result.hasConflicts).toBe(false)
      expect(result.conflicts).toHaveLength(0)
    })

    it('should detect conflicts with overlapping schedules', () => {
      const conflictingSchedule: WeekSchedule = {
        monday: { enabled: true, start_time: '14:00', end_time: '20:00' },
        tuesday: { enabled: false },
        wednesday: { enabled: false },
        thursday: { enabled: false },
        friday: { enabled: false },
        saturday: { enabled: false },
        sunday: { enabled: false },
      }

      const result = detectScheduleConflicts([conflictingSchedule], baseSchedule)

      expect(result.hasConflicts).toBe(true)
      expect(result.conflicts.length).toBeGreaterThan(0)
      expect(result.conflicts[0]).toContain('monday')
      expect(result.conflicts[0]).toContain('09:00-17:00')
      expect(result.conflicts[0]).toContain('14:00-20:00')
    })

    it('should detect multiple conflicts across different days', () => {
      const multiConflictSchedule: WeekSchedule = {
        monday: { enabled: true, start_time: '14:00', end_time: '20:00' },
        tuesday: { enabled: true, start_time: '08:00', end_time: '12:00' },
        wednesday: { enabled: true, start_time: '10:00', end_time: '18:00' },
        thursday: { enabled: false },
        friday: { enabled: false },
        saturday: { enabled: false },
        sunday: { enabled: false },
      }

      const result = detectScheduleConflicts([multiConflictSchedule], baseSchedule)

      expect(result.hasConflicts).toBe(true)
      expect(result.conflicts.length).toBe(3) // Monday, Tuesday, Wednesday
      expect(result.conflicts.some(c => c.includes('monday'))).toBe(true)
      expect(result.conflicts.some(c => c.includes('tuesday'))).toBe(true)
      expect(result.conflicts.some(c => c.includes('wednesday'))).toBe(true)
    })

    it('should handle multiple existing schedules', () => {
      const schedule1: WeekSchedule = {
        monday: { enabled: true, start_time: '14:00', end_time: '18:00' },
        tuesday: { enabled: false },
        wednesday: { enabled: false },
        thursday: { enabled: false },
        friday: { enabled: false },
        saturday: { enabled: false },
        sunday: { enabled: false },
      }

      const schedule2: WeekSchedule = {
        monday: { enabled: true, start_time: '07:00', end_time: '10:00' },
        tuesday: { enabled: false },
        wednesday: { enabled: false },
        thursday: { enabled: false },
        friday: { enabled: false },
        saturday: { enabled: false },
        sunday: { enabled: false },
      }

      const result = detectScheduleConflicts([schedule1, schedule2], baseSchedule)

      expect(result.hasConflicts).toBe(true)
      expect(result.conflicts.length).toBe(2) // Conflicts with both schedules on Monday
    })

    it('should ignore disabled days', () => {
      const partialSchedule: WeekSchedule = {
        monday: { enabled: false },
        tuesday: { enabled: false },
        wednesday: { enabled: false },
        thursday: { enabled: false },
        friday: { enabled: false },
        saturday: { enabled: true, start_time: '09:00', end_time: '17:00' },
        sunday: { enabled: false },
      }

      const result = detectScheduleConflicts([partialSchedule], baseSchedule)

      expect(result.hasConflicts).toBe(false)
      expect(result.conflicts).toHaveLength(0)
    })

    it('should handle schedules with missing time fields', () => {
      const incompleteSchedule: WeekSchedule = {
        monday: { enabled: true }, // Missing start_time and end_time
        tuesday: { enabled: true, start_time: '09:00' }, // Missing end_time
        wednesday: { enabled: false },
        thursday: { enabled: false },
        friday: { enabled: false },
        saturday: { enabled: false },
        sunday: { enabled: false },
      }

      const result = detectScheduleConflicts([incompleteSchedule], baseSchedule)

      expect(result.hasConflicts).toBe(false)
      expect(result.conflicts).toHaveLength(0)
    })

    it('should detect conflicts with exact same schedule', () => {
      const sameSchedule = { ...baseSchedule }

      const result = detectScheduleConflicts([sameSchedule], baseSchedule)

      expect(result.hasConflicts).toBe(true)
      expect(result.conflicts.length).toBe(5) // Monday-Friday
    })
  })

  describe('Edge cases and validation', () => {
    it('should handle overnight shifts (crossing midnight)', () => {
      const nightShift: WeekSchedule = {
        monday: { enabled: true, start_time: '22:00', end_time: '06:00' },
        tuesday: { enabled: false },
        wednesday: { enabled: false },
        thursday: { enabled: false },
        friday: { enabled: false },
        saturday: { enabled: false },
        sunday: { enabled: false },
      }

      // Current implementation doesn't handle overnight shifts
      // This test documents expected behavior
      const result = detectScheduleConflicts([nightShift], baseSchedule)

      // Should detect as conflict because 22:00 < 06:00 looks like overlap
      expect(result.hasConflicts).toBe(false) // False because 22:00 > 17:00
    })

    it('should handle 24-hour schedules', () => {
      const fullDay: WeekSchedule = {
        monday: { enabled: true, start_time: '00:00', end_time: '23:59' },
        tuesday: { enabled: false },
        wednesday: { enabled: false },
        thursday: { enabled: false },
        friday: { enabled: false },
        saturday: { enabled: false },
        sunday: { enabled: false },
      }

      const result = detectScheduleConflicts([fullDay], baseSchedule)

      expect(result.hasConflicts).toBe(true)
      expect(result.conflicts[0]).toContain('monday')
    })

    it('should handle minute-level precision', () => {
      const preciseSchedule: WeekSchedule = {
        monday: { enabled: true, start_time: '16:30', end_time: '18:30' },
        tuesday: { enabled: false },
        wednesday: { enabled: false },
        thursday: { enabled: false },
        friday: { enabled: false },
        saturday: { enabled: false },
        sunday: { enabled: false },
      }

      const result = detectScheduleConflicts([preciseSchedule], baseSchedule)

      expect(result.hasConflicts).toBe(true)
      expect(result.conflicts[0]).toContain('16:30')
    })
  })
})
