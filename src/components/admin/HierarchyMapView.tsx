/**
 * @file HierarchyMapView.tsx
 * @description Vista de mapa/organigrama jerárquico
 * Visualización en árbol de la estructura organizacional
 * Phase 3 - UI Components
 */

import React, { useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HierarchyNode } from './HierarchyNode'
import type { EmployeeHierarchy } from '@/types'

// =====================================================
// TIPOS
// =====================================================

interface HierarchyMapViewProps {
  employees: EmployeeHierarchy[]
  onEmployeeSelect?: (employee: EmployeeHierarchy) => void
}

interface TreeNode {
  employee: EmployeeHierarchy
  children: TreeNode[]
  isExpanded: boolean
}

// =====================================================
// COMPONENTE
// =====================================================

export function HierarchyMapView({ employees, onEmployeeSelect }: Readonly<HierarchyMapViewProps>) {
  const [zoom, setZoom] = useState(100)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // =====================================================
  // TREE BUILDER
  // =====================================================

  const buildTree = (): TreeNode[] => {
    // Encontrar nodos raíz (sin supervisor o supervisor no en lista)
    const rootEmployees = employees.filter(
      emp => !emp.reports_to || !employees.find(e => e.user_id === emp.reports_to)
    )

    const buildNode = (employee: EmployeeHierarchy): TreeNode => {
      const children = employees
        .filter(emp => emp.reports_to === employee.user_id)
        .map(emp => buildNode(emp))

      return {
        employee,
        children,
        isExpanded: expandedNodes.has(employee.user_id),
      }
    }

    return rootEmployees.map(emp => buildNode(emp))
  }

  const tree = buildTree()

  // =====================================================
  // HANDLERS
  // =====================================================

  const toggleExpand = (userId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 150))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50))
  }

  const handleResetZoom = () => {
    setZoom(100)
  }

  const handleExpandAll = () => {
    const allIds = new Set(employees.map(e => e.user_id))
    setExpandedNodes(allIds)
  }

  const handleCollapseAll = () => {
    setExpandedNodes(new Set())
  }

  // =====================================================
  // RENDER NODE RECURSIVO
  // =====================================================

  const renderNode = (node: TreeNode, depth = 0): React.ReactElement => {
    const hasChildren = node.children.length > 0

    return (
      <div key={node.employee.user_id} className="flex flex-col items-center">
        {/* NODO */}
        <HierarchyNode
          employee={node.employee}
          isExpanded={node.isExpanded}
          onToggleExpand={hasChildren ? () => toggleExpand(node.employee.user_id) : undefined}
          onClick={() => onEmployeeSelect?.(node.employee)}
          depth={depth}
        />

        {/* CONECTOR VERTICAL */}
        {hasChildren && node.isExpanded && (
          <div className="w-0.5 h-8 bg-border" />
        )}

        {/* HIJOS */}
        {hasChildren && node.isExpanded && (
          <div className="flex items-start gap-8">
            {node.children.map(child => (
              <div key={child.employee.user_id} className="relative">
                {/* CONECTOR HORIZONTAL (para múltiples hijos) */}
                {node.children.length > 1 && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-border" />
                )}
                {renderNode(child, depth + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // =====================================================
  // RENDER
  // =====================================================

  if (employees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No hay empleados para mostrar</p>
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-[600px] overflow-auto bg-accent/20 rounded-lg">
      {/* ZOOM CONTROLS */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background rounded-lg border p-2 shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoom >= 150}
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetZoom}
          className="h-8 w-8 p-0"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* EXPAND/COLLAPSE CONTROLS */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExpandAll}
        >
          Expandir todo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCollapseAll}
        >
          Colapsar todo
        </Button>
      </div>

      {/* ORGANIGRAMA */}
      <div
        className="p-12 w-max mx-auto transition-transform"
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
      >
        <div className="flex items-start justify-center gap-16">
          {tree.map(node => renderNode(node))}
        </div>
      </div>
    </div>
  )
}

export default HierarchyMapView
