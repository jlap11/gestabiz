import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  label: string;
}

export function ProgressBar({ currentStep, totalSteps, label }: ProgressBarProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-4">
      {/* Header con step indicator y label */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#94a3b8]">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-semibold text-primary">
          {label}
        </span>
      </div>

      {/* Barra de progreso horizontal */}
      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "absolute top-0 left-0 h-full bg-primary",
            "transition-all duration-500 ease-out",
            "shadow-lg shadow-primary/50"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Porcentaje */}
      <p className="text-xs text-muted-foreground mt-2 text-right">
        {Math.round(percentage)}% Complete
      </p>
    </div>
  );
}
