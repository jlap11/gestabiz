import React from 'react'
import WebViewDashboard from '../../components/WebViewDashboard'

/**
 * Employee Dashboard - Renderiza el dashboard web completo
 * 
 * Contenido web incluye:
 * - Mis citas del día
 * - Mis empleos (negocios vinculados)
 * - Vacantes disponibles (matching inteligente)
 * - Ausencias y vacaciones (solicitar, balance)
 * - Aplicar a vacantes
 * - Configuraciones de empleado (horarios, salarios, especializaciones)
 * 
 * ✅ 100% reutilización de código web
 * ✅ Sistema de ausencias completo (validaciones automáticas)
 * ✅ Sistema de vacantes con matching
 */
export default function EmployeeDashboard() {
  return <WebViewDashboard route="/app/employee" />
}
