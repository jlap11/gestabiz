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
        <span className="text-sm font-semibold text-[#8b5cf6]">
          {label}
        </span>
      </div>

      {/* Barra de progreso horizontal */}
      <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn(
            "absolute top-0 left-0 h-full bg-[#8b5cf6]",
            "transition-all duration-500 ease-out",
            "shadow-lg shadow-purple-500/50"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Porcentaje */}
      <p className="text-xs text-[#64748b] mt-2 text-right">
        {Math.round(percentage)}% Complete
      </p>
    </div>
  );
}
