import React from 'react'
import { Building2, ChevronDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { Business } from '@/types/types'

interface BusinessSelectorProps {
  businesses: Business[]
  selectedBusinessId: string | undefined
  onSelectBusiness: (businessId: string) => void
  className?: string
}

export function BusinessSelector({
  businesses,
  selectedBusinessId,
  onSelectBusiness,
  className = '',
}: BusinessSelectorProps) {
  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId)

  // Si solo hay un negocio, mostrar info card sin selector
  if (businesses.length === 1) {
    const business = businesses[0]
    return (
      <div className={`flex items-center gap-3 bg-[#252032] border border-white/10 rounded-lg px-4 py-3 ${className}`}>
        {business.logo_url ? (
          <img
            src={business.logo_url}
            alt={business.name}
            className="w-10 h-10 rounded-lg object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-violet-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{business.name}</h3>
          {business.category && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {business.category.name}
            </Badge>
          )}
        </div>
      </div>
    )
  }

  // Si hay múltiples negocios, mostrar selector
  return (
    <div className={`${className}`}>
      <Select value={selectedBusinessId} onValueChange={onSelectBusiness}>
        <SelectTrigger className="w-full bg-[#252032] border-white/10 hover:bg-[#2a2537] transition-colors">
          <SelectValue>
            {selectedBusiness ? (
              <div className="flex items-center gap-3">
                {selectedBusiness.logo_url ? (
                  <img
                    src={selectedBusiness.logo_url}
                    alt={selectedBusiness.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-violet-400" />
                  </div>
                )}
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-white">{selectedBusiness.name}</span>
                  {selectedBusiness.category && (
                    <span className="text-xs text-gray-400">{selectedBusiness.category.name}</span>
                  )}
                </div>
              </div>
            ) : (
              'Seleccionar negocio'
            )}
          </SelectValue>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectTrigger>
        <SelectContent className="bg-[#252032] border-white/10">
          {businesses.map((business) => (
            <SelectItem
              key={business.id}
              value={business.id}
              className="hover:bg-white/5 focus:bg-white/10"
            >
              <div className="flex items-center gap-3 py-1">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={business.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-violet-400" />
                  </div>
                )}
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-white">{business.name}</span>
                  {business.category && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {business.category.name}
                    </Badge>
                  )}
                  {business.subcategories && business.subcategories.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {business.subcategories.slice(0, 3).map((sub) => (
                        <span key={sub.id} className="text-xs text-gray-400">
                          {sub.subcategory?.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
