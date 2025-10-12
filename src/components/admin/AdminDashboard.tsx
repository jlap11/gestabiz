import React, { useState } from 'react'
import { Building2, LayoutDashboard, MapPin, Briefcase, Users, Settings, ChevronDown, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { OverviewTab } from './OverviewTab'
import { LocationsManager } from './LocationsManager'
import { ServicesManager } from './ServicesManager'
import { BusinessSettings } from './BusinessSettings'
import type { Business } from '@/types/types'

interface AdminDashboardProps {
  business: Business
  businesses: Business[]
  onSelectBusiness: (businessId: string) => void
  onCreateNew?: () => void
  onUpdate?: () => void
}

export function AdminDashboard({ business, businesses, onSelectBusiness, onCreateNew, onUpdate }: Readonly<AdminDashboardProps>) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <header className="bg-[#252032] border-b border-white/10 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-20 h-20 rounded-xl object-contain bg-white/5 p-2 border-2 border-violet-500/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-violet-500/20 flex items-center justify-center border-2 border-violet-500/20">
                <Building2 className="h-9 w-9 text-violet-400" />
              </div>
            )}

            {/* Business Info with Dropdown */}
            <div className="flex-1 min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger className="group flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none">
                  <h1 className="text-2xl font-bold text-white truncate">{business.name}</h1>
                  <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="w-[320px] bg-[#252032] border-white/10 max-h-[400px] overflow-y-auto"
                >
                  {/* Lista de negocios */}
                  {businesses.map((biz) => (
                    <DropdownMenuItem
                      key={biz.id}
                      onClick={() => onSelectBusiness(biz.id)}
                      className={`flex items-start gap-3 p-3 cursor-pointer ${
                        biz.id === business.id 
                          ? 'bg-violet-500/20 text-white' 
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      {/* Logo del negocio */}
                      {biz.logo_url ? (
                        <img
                          src={biz.logo_url}
                          alt={biz.name}
                          className="w-12 h-12 rounded-lg object-contain bg-white/5 p-1.5 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-6 w-6 text-violet-400" />
                        </div>
                      )}
                      
                      {/* Info del negocio */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{biz.name}</div>
                        {biz.category && (
                          <div className="text-xs text-gray-400 truncate mt-0.5">
                            {biz.category.name}
                          </div>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  
                  {/* Separador */}
                  <DropdownMenuSeparator className="bg-white/10" />
                  
                  {/* Opción para crear nuevo negocio */}
                  <DropdownMenuItem
                    onClick={onCreateNew}
                    className="flex items-center gap-3 p-3 cursor-pointer text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
                  >
                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <Plus className="h-5 w-5 text-violet-400" />
                    </div>
                    <div className="font-semibold">Crear Nuevo Negocio</div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Badges de categorías */}
              <div className="flex items-center gap-2 mt-1">
                {business.category && (
                  <Badge variant="secondary" className="text-xs">
                    {business.category.name}
                  </Badge>
                )}
                {business.subcategories && business.subcategories.length > 0 && (
                  <div className="flex gap-1">
                    {business.subcategories.slice(0, 3).map((sub) => (
                      <Badge key={sub.id} variant="outline" className="text-xs border-white/20">
                        {sub.subcategory?.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#252032] border border-white/10 p-1 inline-flex w-auto">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-violet-500 data-[state=active]:text-white"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Resumen
            </TabsTrigger>
            <TabsTrigger
              value="locations"
              className="data-[state=active]:bg-violet-500 data-[state=active]:text-white"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Sedes
            </TabsTrigger>
            <TabsTrigger
              value="services"
              className="data-[state=active]:bg-violet-500 data-[state=active]:text-white"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Servicios
            </TabsTrigger>
            <TabsTrigger
              value="employees"
              className="data-[state=active]:bg-violet-500 data-[state=active]:text-white"
              disabled
            >
              <Users className="h-4 w-4 mr-2" />
              Empleados
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-violet-500 data-[state=active]:text-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <OverviewTab business={business} />
          </TabsContent>

          <TabsContent value="locations" className="mt-0">
            <LocationsManager businessId={business.id} />
          </TabsContent>

          <TabsContent value="services" className="mt-0">
            <ServicesManager businessId={business.id} />
          </TabsContent>

          <TabsContent value="employees" className="mt-0">
            <div className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Gestión de Empleados
              </h3>
              <p className="text-gray-400">
                Esta funcionalidad estará disponible próximamente
              </p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <BusinessSettings business={business} onUpdate={onUpdate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
