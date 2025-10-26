import { ComponentProps, forwardRef } from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimeInputProps extends Omit<ComponentProps<"input">, "type"> {
  label?: string
  error?: string
}

const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={props.id} 
            className="text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
          <input
            type="time"
            ref={ref}
            className={cn(
              // Base styles
              "flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm",
              // Text and placeholder styles
              "text-foreground placeholder:text-muted-foreground",
              // Focus styles
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              // Disabled styles
              "disabled:cursor-not-allowed disabled:opacity-50",
              // Time input specific styles
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              // Hover and transition effects
              "transition-colors hover:border-primary/60",
              // Error styles
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

TimeInput.displayName = "TimeInput"

export { TimeInput }
