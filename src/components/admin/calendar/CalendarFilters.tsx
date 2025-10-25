import React, { useRef } from 'react'
import { ChevronRight, Eye, EyeOff } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { DropdownPortal } from './DropdownPortal'

interface Employee {
  id: string
  user_id: string
  profile_name: string
  profile_avatar?: string
  lunch_break_start?: string | null
  lunch_break_end?: string | null
  has_lunch_break?: boolean
  services?: string[]
}

interface LocationWithHours {
  id: string
  name: string
  opens_at: string | null
  closes_at: string | null
}

interface CalendarFiltersProps {
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  showServices: boolean
  setShowServices: (show: boolean) => void
  filterStatus: string[]
  setFilterStatus: (status: string[]) => void
  filterLocation: string[]
  setFilterLocation: (location: string[]) => void
  filterService: string[]
  setFilterService: (service: string[]) => void
  filterEmployee: string[]
  setFilterEmployee: (employee: string[]) => void
  locations: LocationWithHours[]
  services: Array<{ id: string; name: string }>
  employees: Employee[]
  openDropdowns: {
    status: boolean
    location: boolean
    service: boolean
    employee: boolean
  }
  setOpenDropdowns: (dropdowns: {
    status: boolean
    location: boolean
    service: boolean
    employee: boolean
  }) => void
}

export function CalendarFilters({
  showFilters,
  setShowFilters,
  showServices,
  setShowServices,
  filterStatus,
  setFilterStatus,
  filterLocation,
  setFilterLocation,
  filterService,
  setFilterService,
  filterEmployee,
  setFilterEmployee,
  locations,
  services,
  employees,
  openDropdowns,
  setOpenDropdowns,
}: CalendarFiltersProps) {
  const { t } = useLanguage()
  const statusBtnRef = useRef<HTMLButtonElement>(null)
  const locationBtnRef = useRef<HTMLButtonElement>(null)
  const serviceBtnRef = useRef<HTMLButtonElement>(null)
  const employeeBtnRef = useRef<HTMLButtonElement>(null)

  const resetFilters = () => {
    setFilterStatus(['confirmed'])
    setFilterService([])
    setFilterLocation([])
    setFilterEmployee([])
  }

  return (
    <section 
      className="bg-card border border-border rounded-lg overflow-hidden"
      aria-labelledby="filters-section-title"
    >
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="w-full px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset min-h-[44px]"
        aria-expanded={showFilters}
        aria-controls="filters-content"
        aria-label="Mostrar u ocultar filtros del calendario"
      >
        <h3 id="filters-section-title" className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
          <svg
            className="w-4 h-4 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          {t('admin.appointmentCalendar.filters')}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              resetFilters()
            }}
            className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            aria-label={t('admin.appointmentCalendar.resetFilters')}
            title={t('admin.appointmentCalendar.resetFilters')}
          >
            {t('admin.appointmentCalendar.resetFilters')}
          </button>
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground transition-transform ${showFilters ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />
        </div>
      </button>

      {showFilters && (
        <div id="filters-content" className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Estado Dropdown */}
            <div className="relative">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1">
                {t('admin.appointmentCalendar.statusLabel')}
              </label>
              <button
                ref={statusBtnRef}
                onClick={() => setOpenDropdowns(prev => ({ ...prev, status: !prev.status }))}
                className="px-3 py-2 pr-8 text-sm border border-border rounded-md bg-background dark:bg-slate-900 text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-w-[160px] min-h-[44px] flex items-center justify-between"
                aria-label={t('admin.appointmentCalendar.statusLabel')}
                title={t('admin.appointmentCalendar.statusLabel')}
                aria-haspopup="menu"
                aria-expanded={openDropdowns.status}
              >
                <span className="truncate">{t('admin.appointmentCalendar.selectedCount', { count: filterStatus.length })}</span>
                <ChevronRight
                  className={`h-4 w-4 text-muted-foreground ml-2 transition-transform ${openDropdowns.status ? 'rotate-90' : ''}`}
                  aria-hidden="true"
                />
              </button>
              <DropdownPortal
                anchorRef={statusBtnRef}
                isOpen={openDropdowns.status}
                onClose={() => setOpenDropdowns(prev => ({ ...prev, status: false }))}
              >
                <div className="bg-background dark:bg-slate-900 border border-border rounded-md shadow-lg max-h-64 overflow-y-auto" style={{ maxWidth: '95vw' }} role="menu" aria-label={t('admin.appointmentCalendar.statusLabel')}>
                  <div className="px-2 py-2 border-b border-border">
                    <button
                      className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-muted/40 rounded min-h-[44px]"
                      onClick={() => setFilterStatus(['confirmed', 'pending', 'completed'])}
                      aria-label={t('admin.appointmentCalendar.selectAll')}
                      title={t('admin.appointmentCalendar.selectAll')}
                    >
                      {t('admin.appointmentCalendar.selectAll')}
                    </button>
                  </div>
                  {['confirmed', 'pending', 'completed'].map(status => (
                    <label
                      key={status}
                      className="flex items-center px-3 py-2 hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filterStatus.includes(status)}
                        onChange={e => {
                          if (e.target.checked) {
                            setFilterStatus([...filterStatus, status])
                          } else {
                            setFilterStatus(filterStatus.filter(s => s !== status))
                          }
                        }}
                        className="mr-2 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                      />
                      <span className="text-sm text-foreground">
                        {status === 'confirmed' && t('admin.appointmentCalendar.statuses.confirmed')}
                        {status === 'pending' && t('admin.appointmentCalendar.statuses.pending')}
                        {status === 'completed' && t('admin.appointmentCalendar.statuses.completed')}
                      </span>
                    </label>
                  ))}
                </div>
              </DropdownPortal>
            </div>

            {/* Sede Dropdown */}
            <div className="relative">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1">
                {t('admin.appointmentCalendar.locationLabel')}
              </label>
              <button
                ref={locationBtnRef}
                onClick={() => setOpenDropdowns(prev => ({ ...prev, location: !prev.location }))}
                className="px-3 py-2 pr-8 text-sm border border-border rounded-md bg-background dark:bg-slate-900 text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-w-[160px] min-h-[44px] flex items-center justify-between"
                aria-label={t('admin.appointmentCalendar.locationLabel')}
                title={t('admin.appointmentCalendar.locationLabel')}
                aria-haspopup="menu"
                aria-expanded={openDropdowns.location}
              >
                <span className="truncate">{t('admin.appointmentCalendar.selectedCount', { count: filterLocation.length })}</span>
                <ChevronRight
                  className={`h-4 w-4 text-muted-foreground ml-2 transition-transform ${openDropdowns.location ? 'rotate-90' : ''}`}
                  aria-hidden="true"
                />
              </button>
              <DropdownPortal
                anchorRef={locationBtnRef}
                isOpen={openDropdowns.location}
                onClose={() => setOpenDropdowns(prev => ({ ...prev, location: false }))}
              >
                <div className="bg-background dark:bg-slate-900 border border-border rounded-md shadow-lg max-h-64 overflow-y-auto" style={{ maxWidth: '95vw' }} role="menu" aria-label={t('admin.appointmentCalendar.locationLabel')}>
                  <div className="px-2 py-2 border-b border-border">
                    <button
                      className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-muted/40 rounded min-h-[44px]"
                      onClick={() => setFilterLocation(locations.map(l => l.id))}
                      aria-label={t('admin.appointmentCalendar.selectAll')}
                      title={t('admin.appointmentCalendar.selectAll')}
                    >
                      {t('admin.appointmentCalendar.selectAll')}
                    </button>
                  </div>
                  {locations.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground italic">
                      {t('common.badge.noLocations')}
                    </div>
                  ) : (
                    locations.map(location => (
                      <label
                        key={location.id}
                        className="flex items-center px-3 py-2 hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filterLocation.includes(location.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setFilterLocation([...filterLocation, location.id])
                            } else {
                              setFilterLocation(filterLocation.filter(l => l !== location.id))
                            }
                          }}
                          className="mr-2 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        />
                        <span className="text-sm text-foreground truncate">{location.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </DropdownPortal>
            </div>

            {/* Servicio Dropdown */}
            <div className="relative">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1">
                {t('admin.appointmentCalendar.serviceLabel')}
              </label>
              <button
                ref={serviceBtnRef}
                onClick={() => setOpenDropdowns(prev => ({ ...prev, service: !prev.service }))}
                className="px-3 py-2 pr-8 text-sm border border-border rounded-md bg-background dark:bg-slate-900 text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-w-[160px] min-h-[44px] flex items-center justify-between"
                aria-label={t('admin.appointmentCalendar.serviceLabel')}
                title={t('admin.appointmentCalendar.serviceLabel')}
                aria-haspopup="menu"
                aria-expanded={openDropdowns.service}
              >
                <span className="truncate">{t('admin.appointmentCalendar.selectedCount', { count: filterService.length })}</span>
                <ChevronRight
                  className={`h-4 w-4 text-muted-foreground ml-2 transition-transform ${openDropdowns.service ? 'rotate-90' : ''}`}
                  aria-hidden="true"
                />
              </button>
              <DropdownPortal
                anchorRef={serviceBtnRef}
                isOpen={openDropdowns.service}
                onClose={() => setOpenDropdowns(prev => ({ ...prev, service: false }))}
              >
                <div className="bg-background dark:bg-slate-900 border border-border rounded-md shadow-lg max-h-64 overflow-y-auto" style={{ maxWidth: '95vw' }} role="menu" aria-label={t('admin.appointmentCalendar.serviceLabel')}>
                  <div className="px-2 py-2 border-b border-border">
                    <button
                      className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-muted/40 rounded min-h-[44px]"
                      onClick={() => setFilterService(services.map(s => s.id))}
                      aria-label={t('admin.appointmentCalendar.selectAll')}
                      title={t('admin.appointmentCalendar.selectAll')}
                    >
                      {t('admin.appointmentCalendar.selectAll')}
                    </button>
                  </div>
                  {services.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground italic">
                      {t('common.badge.noServices')}
                    </div>
                  ) : (
                    services.map(service => (
                      <label
                        key={service.id}
                        className="flex items-center px-3 py-2 hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filterService.includes(service.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setFilterService([...filterService, service.id])
                            } else {
                              setFilterService(filterService.filter(s => s !== service.id))
                            }
                          }}
                          className="mr-2 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        />
                        <span className="text-sm text-foreground truncate">{service.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </DropdownPortal>
            </div>

            {/* Empleado Dropdown */}
            <div className="relative">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1">
                {t('admin.appointmentCalendar.employeeLabel')}
              </label>
              <button
                ref={employeeBtnRef}
                onClick={() => setOpenDropdowns(prev => ({ ...prev, employee: !prev.employee }))}
                className="px-3 py-2 pr-8 text-sm border border-border rounded-md bg-background dark:bg-slate-900 text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-w-[160px] min-h-[44px] flex items-center justify-between"
                aria-label={t('admin.appointmentCalendar.employeeLabel')}
                title={t('admin.appointmentCalendar.employeeLabel')}
                aria-haspopup="menu"
                aria-expanded={openDropdowns.employee}
              >
                <span className="truncate">{t('admin.appointmentCalendar.selectedCount', { count: filterEmployee.length })}</span>
                <ChevronRight
                  className={`h-4 w-4 text-muted-foreground ml-2 transition-transform ${openDropdowns.employee ? 'rotate-90' : ''}`}
                  aria-hidden="true"
                />
              </button>
              <DropdownPortal
                anchorRef={employeeBtnRef}
                isOpen={openDropdowns.employee}
                onClose={() => setOpenDropdowns(prev => ({ ...prev, employee: false }))}
              >
                <div className="bg-background dark:bg-slate-900 border border-border rounded-md shadow-lg max-h-64 overflow-y-auto" style={{ maxWidth: '95vw' }} role="menu" aria-label={t('admin.appointmentCalendar.employeeLabel')}>
                  <div className="px-2 py-2 border-b border-border">
                    <button
                      className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-muted/40 rounded min-h-[44px]"
                      onClick={() => setFilterEmployee(employees.map(e => e.id))}
                      aria-label={t('admin.appointmentCalendar.selectAll')}
                      title={t('admin.appointmentCalendar.selectAll')}
                    >
                      {t('admin.appointmentCalendar.selectAll')}
                    </button>
                  </div>
                  {employees.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground italic">
                      {t('common.badge.noEmployees')}
                    </div>
                  ) : (
                    employees.map(employee => (
                      <label
                        key={employee.id}
                        className="flex items-center px-3 py-2 hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filterEmployee.includes(employee.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setFilterEmployee([...filterEmployee, employee.id])
                            } else {
                              setFilterEmployee(filterEmployee.filter(e => e !== employee.id))
                            }
                          }}
                          className="mr-2 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        />
                        <span className="text-sm text-foreground truncate">{employee.profile_name}</span>
                      </label>
                    ))
                  )}
                </div>
              </DropdownPortal>
            </div>
          </div>

          {/* Toggle Services Visibility */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm font-medium text-foreground">
              {t('admin.appointmentCalendar.showServices')}
            </span>
            <button
              onClick={() => setShowServices(!showServices)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
              aria-label={showServices ? t('admin.appointmentCalendar.hideServices') : t('admin.appointmentCalendar.showServices')}
            >
              {showServices ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  {t('admin.appointmentCalendar.hide')}
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  {t('admin.appointmentCalendar.show')}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}