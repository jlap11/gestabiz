/**
 * Definición centralizada de planes de suscripción
 * Usado por PricingPage.tsx y PricingPlans.tsx
 */

import React from 'react'
import { Building2, Crown, Rocket, Sparkles } from 'lucide-react'

export interface PlanFeature {
  name: string
  included: boolean
  limit?: string
  highlight?: boolean
}

export interface Plan {
  id: string
  name: string
  subtitle?: string
  description: string
  price: number | null // null para precio custom
  priceAnnual?: number | null
  popular?: boolean
  icon?: React.ReactNode
  cta?: string
  limits?: {
    businesses?: number | string
    locations?: number | string
    employees?: number | string
    appointments?: number | string
    clients?: number | string
    services?: number | string
  }
  features: PlanFeature[]
}

const planIcons = {
  gratuito: React.createElement(Sparkles, { className: 'h-6 w-6' }),
  inicio: React.createElement(Building2, { className: 'h-6 w-6' }),
  profesional: React.createElement(Rocket, { className: 'h-6 w-6' }),
  empresarial: React.createElement(Crown, { className: 'h-6 w-6' }),
}

export const PRICING_PLANS: Plan[] = [
  {
    id: 'gratuito',
    name: 'Gratuito',
    subtitle: 'Para Emprendedores',
    description: 'Perfecto para independientes y emprendimientos unipersonales',
    price: 0,
    priceAnnual: 0,
    popular: false,
    icon: planIcons.gratuito,
    cta: 'Plan Actual',
    limits: {
      businesses: 1,
      locations: 1,
      employees: 1,
      appointments: 50,
      clients: 100,
      services: 10,
    },
    features: [
      { name: 'Gestión completa de citas y calendario', included: true },
      { name: 'Recordatorios automáticos (Email + WhatsApp)', included: true },
      { name: 'Gestión básica de clientes', included: true },
      { name: 'Catálogo de servicios', included: true },
      { name: 'Dashboard con estadísticas básicas', included: true },
      { name: 'App móvil incluida', included: true },
      { name: 'Soporte por email', included: true },
      { name: 'Multi-ubicación', included: false },
      { name: 'Sistema contable', included: false },
      { name: 'Portal de empleos', included: false },
    ],
  },
  {
    id: 'inicio',
    name: 'Inicio',
    subtitle: 'Para PyMES',
    description: 'Ideal para negocios pequeños con múltiples empleados',
    price: 80000,
    priceAnnual: 800000,
    popular: true,
    icon: planIcons.inicio,
    cta: 'Actualizar Ahora',
    limits: {
      businesses: 1,
      locations: 3,
      employees: 6,
      appointments: 'Ilimitado',
      clients: 'Ilimitado',
      services: 'Ilimitado',
    },
    features: [
      { name: 'Todo del Plan Gratuito, más:', included: true, highlight: true },
      { name: 'Multi-ubicación (hasta 3 sucursales)', included: true },
      { name: 'Sistema contable básico (P&L, IVA, ICA)', included: true },
      { name: 'Gestión avanzada de clientes', included: true },
      { name: 'Reseñas y calificaciones públicas', included: true },
      { name: 'Sincronización Google Calendar', included: true },
      { name: 'Chat interno entre empleados', included: true },
      { name: 'Exportación de reportes (CSV, Excel)', included: true },
      { name: 'Extensión de navegador', included: true },
      { name: 'Soporte prioritario (Chat + Email)', included: true },
    ],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    subtitle: 'Para Empresas Medianas',
    description: 'Para empresas con múltiples sucursales y equipos grandes',
    price: 200000,
    priceAnnual: 2000000,
    popular: false,
    icon: planIcons.profesional,
    cta: 'Próximamente',
    limits: {
      businesses: 1,
      locations: 10,
      employees: 21,
      appointments: 'Ilimitado',
      clients: 'Ilimitado',
      services: 'Ilimitado',
    },
    features: [
      { name: 'Todo del Plan Inicio, más:', included: true, highlight: true },
      { name: 'Sistema contable completo + Facturación DIAN', included: true },
      { name: 'Reportes fiscales avanzados', included: true },
      { name: 'Portal de empleos/reclutamiento', included: true },
      { name: 'Analytics avanzados con IA', included: true },
      { name: 'API Access para integraciones', included: true },
      { name: 'Soporte Premium (Teléfono + WhatsApp)', included: true },
      { name: 'Onboarding personalizado', included: true },
      { name: 'Branding personalizado', included: true },
      { name: 'Capacitación del equipo', included: true },
    ],
  },
  {
    id: 'empresarial',
    name: 'Empresarial',
    subtitle: 'Para Grandes Empresas',
    description: 'Solución enterprise con servidor dedicado y soporte 24/7',
    price: 500000,
    priceAnnual: 5000000,
    popular: false,
    icon: planIcons.empresarial,
    cta: 'Próximamente',
    limits: {
      businesses: 'Ilimitado',
      locations: 'Ilimitado',
      employees: 'Ilimitado',
      appointments: 'Ilimitado',
      clients: 'Ilimitado',
      services: 'Ilimitado',
    },
    features: [
      { name: 'Todo del Plan Profesional, más:', included: true, highlight: true },
      { name: 'Servidor dedicado o instancia privada', included: true },
      { name: 'SLA garantizado (99.9% uptime)', included: true },
      { name: 'Desarrollo de funcionalidades custom', included: true },
      { name: 'Integraciones a medida', included: true },
      { name: 'Account Manager dedicado', included: true },
      { name: 'Soporte 24/7', included: true },
      { name: 'Capacitación presencial', included: true },
      { name: 'Migración de datos desde otros sistemas', included: true },
      { name: 'Backup diario dedicado', included: true },
    ],
  },
]

/**
 * Obtener plan por ID
 */
export function getPlanById(id: string): Plan | undefined {
  return PRICING_PLANS.find(plan => plan.id === id)
}

/**
 * Obtener todos los planes excepto uno
 */
export function getPlansByExcluding(excludeId: string): Plan[] {
  return PRICING_PLANS.filter(plan => plan.id !== excludeId)
}
