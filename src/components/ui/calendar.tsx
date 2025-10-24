import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isInRange?: boolean // Día está dentro del rango de fechas
  isRangeStart?: boolean // Es la fecha de inicio del rango
  isRangeEnd?: boolean // Es la fecha de fin del rango
}

export interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  title?: (date: Date) => string | '' // Para mostrar tooltip de días deshabilitados
  className?: string
  dateRangeStart?: Date // Fecha de inicio del rango (para sombrear)
  dateRangeEnd?: Date // Fecha de fin del rango (para sombrear)
}

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export const Calendar = ({
  selected,
  onSelect,
  disabled,
  title,
  className,
  dateRangeStart,
  dateRangeEnd,
}: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(selected || new Date())
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('right')
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false)

  const today = useMemo(() => new Date(), [])

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
    const firstDayWeekday = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()

    // Función auxiliar para verificar si una fecha está en el rango
    const isDateInRange = (date: Date): boolean => {
      if (!dateRangeStart || !dateRangeEnd) return false
      const dateTime = date.getTime()
      const startTime = dateRangeStart.getTime()
      const endTime = dateRangeEnd.getTime()
      return dateTime >= startTime && dateTime <= endTime
    }

    // Función para verificar si es inicio o fin del rango
    const isDateRangeStart = (date: Date): boolean => {
      return dateRangeStart ? date.toDateString() === dateRangeStart.toDateString() : false
    }

    const isDateRangeEnd = (date: Date): boolean => {
      return dateRangeEnd ? date.toDateString() === dateRangeEnd.toDateString() : false
    }

    const days: CalendarDay[] = []

    // Días del mes anterior
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth, -i)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isInRange: isDateInRange(date),
        isRangeStart: isDateRangeStart(date),
        isRangeEnd: isDateRangeEnd(date),
      })
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const isToday = date.toDateString() === today.toDateString()
      const isSelected = Boolean(
        selected && selected instanceof Date && date.toDateString() === selected.toDateString()
      )

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        isSelected,
        isInRange: isDateInRange(date),
        isRangeStart: isDateRangeStart(date),
        isRangeEnd: isDateRangeEnd(date),
      })
    }

    // Completar con días del siguiente mes
    const remainingDays = 42 - days.length // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isInRange: isDateInRange(date),
        isRangeStart: isDateRangeStart(date),
        isRangeEnd: isDateRangeEnd(date),
      })
    }

    return days
  }, [currentYear, currentMonth, selected, today, dateRangeStart, dateRangeEnd])

  const handleDateClick = (date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return
    if (disabled?.(date)) return

    const newDate = new Date(date)
    onSelect?.(newDate)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setAnimationDirection(direction === 'prev' ? 'left' : 'right')

    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleYearChange = (year: number) => {
    setCurrentDate(prev => new Date(year, prev.getMonth(), 1))
    setIsYearPickerOpen(false)
  }

  const slideVariants = {
    enter: (direction: string) => ({
      x: direction === 'right' ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: string) => ({
      x: direction === 'right' ? -300 : 300,
      opacity: 0,
    }),
  }

  const yearOptions = useMemo(() => {
    const years: number[] = []
    const currentYear = new Date().getFullYear()
    for (let i = currentYear - 50; i <= currentYear + 50; i++) {
      years.push(i)
    }
    return years
  }, [])

  return (
    <div className={`w-full max-w-md p-4 sm:p-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth('prev')}
          className="h-8 w-8 rounded-full hover:bg-secondary/80 transition-colors duration-200"
        >
          <ChevronLeft size={16} />
        </Button>

        <div className="flex items-center gap-2">
          <motion.h2
            className="text-xl font-medium text-foreground tracking-tight"
            key={currentMonth}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {MONTHS[currentMonth]}
          </motion.h2>

          <Button
            variant="ghost"
            onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
            className="text-xl font-medium hover:bg-secondary/80 transition-colors duration-200 px-2"
          >
            {currentYear}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth('next')}
          className="h-8 w-8 rounded-full hover:bg-secondary/80 transition-colors duration-200"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Year Picker */}
      <AnimatePresence>
        {isYearPickerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-4"
          >
            <div className="max-h-32 overflow-y-auto bg-secondary/50 rounded-lg p-2">
              {yearOptions.map(year => (
                <Button
                  key={year}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleYearChange(year)}
                  className={`w-full justify-start text-sm ${
                    year === currentYear ? 'bg-accent text-accent-foreground' : ''
                  }`}
                >
                  {year}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
        {WEEKDAYS.map(day => (
          <div
            key={day}
            className="h-7 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={animationDirection}>
          <motion.div
            key={`${currentYear}-${currentMonth}`}
            custom={animationDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="grid grid-cols-7 gap-0.5 sm:gap-1"
          >
            {calendarDays.map((day, index) => {
              const isDisabled = disabled ? disabled(day.date) : false
              const tooltipText = title ? title(day.date) : ''

              return (
                <motion.button
                  key={`${day.date.toISOString()}-${index}`}
                  onClick={() => handleDateClick(day.date, day.isCurrentMonth)}
                  disabled={!day.isCurrentMonth || isDisabled}
                  title={tooltipText}
                  className={`
                    h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 relative
                    ${
                      day.isCurrentMonth && !isDisabled
                        ? 'hover:bg-secondary/80 cursor-pointer'
                        : 'text-muted-foreground/30 cursor-default'
                    }
                    ${
                      day.isInRange && !day.isSelected && !day.isRangeStart && !day.isRangeEnd
                        ? 'bg-accent/20 text-foreground'
                        : ''
                    }
                    ${
                      day.isRangeStart || day.isRangeEnd || day.isSelected
                        ? 'bg-accent text-accent-foreground shadow-lg'
                        : 'text-foreground'
                    }
                    ${
                      day.isToday && !day.isSelected && !day.isRangeStart && !day.isRangeEnd
                        ? 'ring-2 ring-accent/50'
                        : ''
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  whileHover={day.isCurrentMonth && !isDisabled ? { scale: 1.05 } : {}}
                  whileTap={day.isCurrentMonth && !isDisabled ? { scale: 0.95 } : {}}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: index * 0.01,
                    duration: 0.2,
                  }}
                >
                  {day.date.getDate()}

                  {day.isToday && (
                    <motion.div
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-accent rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.01 + 0.2 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Selected Date Display */}
      <AnimatePresence>
        {selected && selected instanceof Date && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-6 pt-4 border-t border-border"
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Fecha seleccionada</p>
              <p className="text-lg font-medium text-foreground">
                {selected.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
