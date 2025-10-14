// src/components/billing/PaymentHistory.tsx
// Payment history table with filters, pagination, and PDF/CSV export
// Integrates with subscription_payments table

import React, { useState, useMemo } from 'react'
import { Calendar, Download, FileText, Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

interface PaymentHistoryProps {
  payments: Array<{
    id: string
    amount: number
    currency: string
    status: 'succeeded' | 'failed' | 'pending' | 'refunded'
    paid_at: string | null
    invoice_pdf: string | null
    description: string | null
    failure_reason: string | null
  }>
}

type StatusFilter = 'all' | 'succeeded' | 'failed' | 'pending' | 'refunded'
type PeriodFilter = 'all' | 'last30' | 'last90' | 'last365' | 'custom'

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100) // Stripe amounts are in cents
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Pendiente'
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Status filter
      if (statusFilter !== 'all' && payment.status !== statusFilter) {
        return false
      }

      // Period filter
      if (periodFilter !== 'all' && payment.paid_at) {
        const paymentDate = new Date(payment.paid_at)
        const now = new Date()
        const daysDiff = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)

        if (periodFilter === 'last30' && daysDiff > 30) return false
        if (periodFilter === 'last90' && daysDiff > 90) return false
        if (periodFilter === 'last365' && daysDiff > 365) return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          payment.id.toLowerCase().includes(query) ||
          payment.description?.toLowerCase().includes(query) ||
          payment.status.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [payments, statusFilter, periodFilter, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Fecha', 'ID Transacción', 'Monto', 'Estado', 'Descripción']
    const rows = filteredPayments.map((payment) => [
      formatDate(payment.paid_at),
      payment.id,
      formatCurrency(payment.amount, payment.currency),
      payment.status,
      payment.description || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `historial-pagos-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Historial exportado a CSV')
  }

  // Export to PDF (basic implementation)
  const handleExportPDF = () => {
    toast.info('Generando PDF...', { duration: 2000 })
    
    // In production, use a library like jsPDF or call an Edge Function
    setTimeout(() => {
      toast.success('PDF generado (implementación simulada)')
    }, 2000)
  }

  // Download invoice
  const handleDownloadInvoice = (invoiceUrl: string | null) => {
    if (!invoiceUrl) {
      toast.error('Factura no disponible')
      return
    }

    window.open(invoiceUrl, '_blank')
    toast.success('Descargando factura...')
  }

  // Status badge variant
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      succeeded: { variant: 'default', label: 'Exitoso' },
      failed: { variant: 'destructive', label: 'Fallido' },
      pending: { variant: 'secondary', label: 'Pendiente' },
      refunded: { variant: 'outline', label: 'Reembolsado' },
    }

    const { variant, label } = variants[status] || { variant: 'outline' as const, label: status }
    return (
      <Badge variant={variant}>
        {label}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Pagos</CardTitle>
        <CardDescription>
          Consulta todas tus transacciones y descarga facturas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="succeeded">Exitosos</SelectItem>
              <SelectItem value="failed">Fallidos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="refunded">Reembolsados</SelectItem>
            </SelectContent>
          </Select>

          {/* Period Filter */}
          <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="last30">Últimos 30 días</SelectItem>
              <SelectItem value="last90">Últimos 90 días</SelectItem>
              <SelectItem value="last365">Último año</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleExportCSV} title="Exportar CSV">
              <FileText className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExportPDF} title="Exportar PDF">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground mb-4">
          Mostrando {paginatedPayments.length} de {filteredPayments.length} transacciones
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>ID Transacción</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron pagos
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {formatDate(payment.paid_at)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.id.substring(0, 12)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.description || 'Pago de suscripción'}</div>
                        {payment.failure_reason && (
                          <div className="text-xs text-destructive mt-1">{payment.failure_reason}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      {payment.invoice_pdf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(payment.invoice_pdf)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Factura
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
