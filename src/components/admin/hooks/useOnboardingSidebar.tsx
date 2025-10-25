import { useMemo } from 'react'
import {
  Briefcase,
  BriefcaseBusiness,
  Calculator,
  CreditCard,
  FileText,
  LayoutDashboard,
  MapPin,
  Shield,
  Users,
} from 'lucide-react'
import type { Business, User } from '@/types/types'

interface UseOnboardingSidebarProps {
  user: User
  businesses: Business[]
  onNavigateToAdmin?: () => void
}

export function useOnboardingSidebar({ user, businesses, onNavigateToAdmin }: UseOnboardingSidebarProps) {
  const sidebarItems = useMemo(() => [
    {
      id: 'overview',
      label: 'Resumen',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      id: 'locations',
      label: 'Sedes',
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      id: 'services',
      label: 'Servicios',
      icon: <Briefcase className="h-5 w-5" />,
    },
    {
      id: 'employees',
      label: 'Empleados',
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: 'recruitment',
      label: 'Reclutamiento',
      icon: <BriefcaseBusiness className="h-5 w-5" />,
    },
    {
      id: 'accounting',
      label: 'Contabilidad',
      icon: <Calculator className="h-5 w-5" />,
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 'billing',
      label: 'Facturación',
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      id: 'permissions',
      label: 'Permisos',
      icon: <Shield className="h-5 w-5" />,
    },
  ], [])

  // Use existing business if available, otherwise create placeholder
  const currentBusiness = useMemo(() => {
    if (businesses && businesses.length > 0) {
      return businesses[0]
    }

    return {
      id: 'new-business',
      name: 'Crear tu Negocio',
      description: 'Nuevo negocio en creación',
      owner_id: user?.id || '',
      category: {
        id: 'placeholder',
        name: 'Sin categoría',
        slug: '',
        is_active: true,
        sort_order: 0,
      },
      phone: null,
      email: null,
      address: null,
      city: null,
      state: null,
      country: null,
      postal_code: null,
      latitude: undefined,
      longitude: undefined,
      logo_url: null,
      website: null,
      business_hours: {},
      timezone: undefined,
      settings: {},
      category_id: undefined,
      legal_entity_type: undefined,
      tax_id: null,
      legal_name: null,
      registration_number: null,
      slug: null,
      meta_title: null,
      meta_description: null,
      meta_keywords: undefined,
      og_image_url: null,
      is_public: undefined,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as Business
  }, [businesses, user?.id])

  // Handler for page changes - navigate to admin if clicking non-onboarding pages
  const handlePageChange = (pageId: string, setActivePage: (page: string) => void) => {
    // Only allow 'overview' and 'create-business' pages in onboarding
    // For any other page, navigate back to full admin dashboard
    if (pageId !== 'overview' && pageId !== 'create-business') {
      // Navigate to admin dashboard instead
      if (onNavigateToAdmin) {
        onNavigateToAdmin()
      }
      return
    }
    setActivePage(pageId)
  }

  return {
    sidebarItems,
    currentBusiness,
    handlePageChange,
  }
}
