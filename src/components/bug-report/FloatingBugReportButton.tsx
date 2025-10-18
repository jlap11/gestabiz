import React, { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BugReportModal } from './BugReportModal'
import { cn } from '@/lib/utils'

interface FloatingBugReportButtonProps {
  className?: string
}

export function FloatingBugReportButton({ className }: FloatingBugReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <>
      {/* Floating Button */}
      <div
        className={cn(
          'fixed z-50 transition-all duration-300',
          'bottom-6 left-6',
          'sm:bottom-8 sm:left-8',
          className
        )}
      >
        <Button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            'relative rounded-full shadow-lg transition-all duration-300',
            'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
            'text-white border-0',
            isHovered ? 'pr-6 pl-5' : 'p-4',
            'group'
          )}
          size="lg"
        >
          {/* Icon Container */}
          <div className="relative flex items-center gap-2">
            <AlertCircle 
              className={cn(
                'h-6 w-6 transition-transform duration-300',
                isHovered && 'scale-110'
              )} 
            />
            
            {/* Text Label - aparece en hover */}
            <span
              className={cn(
                'font-semibold text-sm whitespace-nowrap transition-all duration-300',
                isHovered ? 'opacity-100 w-auto max-w-[200px]' : 'opacity-0 w-0 max-w-0 overflow-hidden'
              )}
            >
              Reportar Problema
            </span>
          </div>

          {/* Pulse Animation Ring */}
          <span
            className={cn(
              'absolute inset-0 rounded-full',
              'bg-orange-400 opacity-75',
              'animate-ping',
              isHovered && 'animate-none'
            )}
            style={{
              animationDuration: '2s',
              animationIterationCount: 'infinite',
            }}
          />

          {/* Notification Badge (opcional - puede ser usado para indicar bugs pendientes) */}
          {/* <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold border-2 border-white">
            !
          </span> */}
        </Button>

        {/* Tooltip en Desktop */}
        {!isHovered && (
          <div className="hidden lg:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
            <div className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              ¿Encontraste un bug?
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bug Report Modal */}
      <BugReportModal 
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  )
}
