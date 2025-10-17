import { ComponentProps, forwardRef, useState, useEffect, useRef, useMemo } from "react"
import DatePicker from "react-datepicker"
import { format, parse } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import "react-datepicker/dist/react-datepicker.css"

// Extracted PopperContainer component
const PopperContainer = ({ children, popperRef }: { children: React.ReactNode, popperRef: React.RefObject<HTMLDivElement | null> }) => (
  <div
    ref={popperRef}
    style={{position:'relative', background: '#18181b', borderRadius: '8px', padding: '0'}}
  >
    {children}
  </div>
)

// Factory function for popper container to avoid inline component warnings
const createPopperContainer = (popperRef: React.RefObject<HTMLDivElement | null>) => 
  (props: { children: React.ReactNode }) => <PopperContainer popperRef={popperRef}>{props.children}</PopperContainer>

interface CustomDateInputProps extends Omit<ComponentProps<"input">, "type" | "value" | "onChange"> {
    label?: string
    error?: string
    value?: string
    onChange?: (value: string) => void
    min?: string
    max?: string
}

const CustomDateInput = forwardRef<HTMLDivElement, CustomDateInputProps>(
    ({ className, label, error, value, onChange, min, max, ...props }, ref) => {
        const [selectedDate, setSelectedDate] = useState<Date | null>(
            value ? parse(value, 'yyyy-MM-dd', new Date()) : null
        )
        const popperRef = useRef<HTMLDivElement>(null)

        useEffect(() => {
      setSelectedDate(value ? parse(value, 'yyyy-MM-dd', new Date()) : null)
    }, [value])



        const handleDateChange = (date: Date | null) => {
            setSelectedDate(date)
            if (onChange) {
                onChange(date ? format(date, 'yyyy-MM-dd') : '')
            }
        }

        const minDate = min ? parse(min, 'yyyy-MM-dd', new Date()) : undefined
        const maxDate = max ? parse(max, 'yyyy-MM-dd', new Date()) : undefined
        
        // Memoize the popper container function to prevent re-creation on every render
        const popperContainerFn = useMemo(() => createPopperContainer(popperRef), [popperRef])

        // Inject CSS styles into document head
        useEffect(() => {
            const styleId = 'react-datepicker-custom-styles'
            // Remover estilo antiguo si existe
            const existingStyle = document.getElementById(styleId)
            if (existingStyle) {
                existingStyle.remove()
            }
            
            const style = document.createElement('style')
            style.id = styleId
            style.textContent = `
          .react-datepicker-wrapper {
            width: 100%;
          }
          .react-datepicker-popper {
            z-index: 9999 !important;
          }
          .react-datepicker-popper[data-placement] {
            background: hsl(var(--background)) !important;
            background-color: hsl(var(--background)) !important;
            border-radius: 8px !important;
            padding: 0 !important;
          }
          .react-datepicker-popper .react-datepicker {
            background: hsl(var(--background)) !important;
            background-color: hsl(var(--background)) !important;
            border: 1px solid hsl(var(--border)) !important;
          }
          .react-datepicker,
          .react-datepicker__month,
          .react-datepicker__header {
            background: hsl(var(--background)) !important;
            background-color: hsl(var(--background)) !important;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
          }
          .react-datepicker {
            font-family: inherit;
            border: 1px solid hsl(var(--border));
            border-radius: 8px;
            color: hsl(var(--foreground));
          }
          .react-datepicker__header {
            border-bottom: 1px solid hsl(var(--border));
            border-radius: 8px 8px 0 0;
            padding: 8px 0;
          }
          
          .react-datepicker__current-month {
            color: hsl(var(--foreground)) !important;
            font-weight: 600;
            font-size: 0.875rem;
            margin-bottom: 8px;
          }
          
          .react-datepicker__day-names {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          
          .react-datepicker__day-name {
            color: hsl(var(--muted-foreground)) !important;
            font-weight: 500;
            font-size: 0.75rem;
            width: 2rem;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .react-datepicker__month {
            padding: 8px;
            background: #18181b !important;
            background-color: #18181b !important;
          }
          
          .react-datepicker__week {
            display: flex;
            justify-content: space-between;
          }
          
          .react-datepicker__day {
            color: hsl(var(--foreground)) !important;
            width: 2rem;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s;
            margin: 1px;
            background: transparent !important;
            background-color: transparent !important;
          }
          
          .react-datepicker__day:hover {
            background-color: hsl(var(--accent)) !important;
            color: hsl(var(--accent-foreground)) !important;
          }
          
          .react-datepicker__day--selected {
            background-color: hsl(var(--primary)) !important;
            color: hsl(var(--primary-foreground)) !important;
            font-weight: 600;
          }
          
          .react-datepicker__day--selected:hover {
            background-color: hsl(var(--primary)) !important;
            color: hsl(var(--primary-foreground)) !important;
          }
          
          .react-datepicker__day--today {
            background-color: hsl(var(--secondary)) !important;
            color: hsl(var(--secondary-foreground)) !important;
            font-weight: 600;
          }
          
          .react-datepicker__day--today:hover {
            background-color: hsl(var(--accent)) !important;
            color: hsl(var(--accent-foreground)) !important;
          }
          
          .react-datepicker__day--outside-month {
            color: hsl(var(--muted-foreground)) !important;
            opacity: 0.5;
          }
          
          .react-datepicker__day--outside-month:hover {
            background-color: hsl(var(--muted)) !important;
            color: hsl(var(--muted-foreground)) !important;
            opacity: 0.7;
          }
          
          .react-datepicker__day--disabled {
            color: hsl(var(--muted-foreground)) !important;
            opacity: 0.3;
            cursor: not-allowed;
          }
          
          .react-datepicker__day--disabled:hover {
            background-color: transparent !important;
            color: hsl(var(--muted-foreground)) !important;
            opacity: 0.3;
          }
          
          .react-datepicker__navigation {
            background: none;
            border: none;
            cursor: pointer;
            outline: none;
            top: 13px;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
          }
          
          .react-datepicker__navigation:hover {
            background-color: hsl(var(--accent));
          }
          
          .react-datepicker__navigation--previous {
            left: 8px;
          }
          
          .react-datepicker__navigation--next {
            right: 8px;
          }
          
          .react-datepicker__navigation-icon {
            position: relative;
            top: 0;
          }
          
          .react-datepicker__navigation-icon::before {
            border-color: hsl(var(--foreground));
            border-width: 2px 2px 0 0;
            width: 6px;
            height: 6px;
          }
          
          .react-datepicker__triangle {
            display: none;
          }
        `
                document.head.appendChild(style)
        }, [])

        return (
      <div ref={ref} className="space-y-2">
        {label && (
          <label
            htmlFor={props.id}
            className="text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {/* Fondo oscuro detrás del datepicker popper, solo visible si abierto */}
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="dd/MM/yyyy"
            locale={es}
            minDate={minDate}
            maxDate={maxDate}
            placeholderText="dd/mm/yyyy"
            autoComplete="off"
            className={cn(
              // Base styles
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              // Text and placeholder styles
              "text-foreground placeholder:text-muted-foreground",
              // Focus styles
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              // Disabled styles
              "disabled:cursor-not-allowed disabled:opacity-50",
              // Hover and transition effects
              "transition-colors hover:border-primary/60",
              // Error styles
              error && "border-destructive focus-visible:ring-destructive",
              "pr-10", // Space for icon
              className
            )}
            popperClassName="z-50"
            popperContainer={popperContainerFn}
          />
          {/* Custom calendar icon */}
          <CalendarDays
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
        )
    }
)

CustomDateInput.displayName = "CustomDateInput"

export { CustomDateInput }
