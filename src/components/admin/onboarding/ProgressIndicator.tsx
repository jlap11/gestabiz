interface ProgressIndicatorProps {
  currentStep: number
  totalSteps?: number
}

export function ProgressIndicator({ currentStep, totalSteps = 3 }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, index) => (
        <div
          key={index + 1}
          className={`h-2 w-24 rounded-full ${
            currentStep >= index + 1 ? 'bg-primary' : 'bg-border'
          }`}
        />
      ))}
    </div>
  )
}