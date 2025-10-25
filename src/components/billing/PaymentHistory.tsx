// src/components/billing/PaymentHistory.tsx
// Payment history table with filters, pagination, and PDF/CSV export
// Integrates with subscription_payments table

import React, { useMemo, useState } from 'react'
import { Calendar, Download, FileText, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useLanguage } from '@/contexts/LanguageContext'
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
  const { t } = useLanguage()
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
    return payments.filter(payment => {
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
    const rows = filteredPayments.map(payment => [
      formatDate(payment.paid_at),
      payment.id,
      formatCurrency(payment.amount, payment.currency),
      payment.status,
      payment.description || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
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

    toast.success(t('billing.historyExportedCSV'))
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
    const variants: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
      succeeded: { variant: 'default', label: 'Exitoso' },
      failed: { variant: 'destructive', label: 'Fallido' },
      pending: { variant: 'secondary', label: 'Pendiente' },
      refunded: { variant: 'outline', label: 'Reembolsado' },
    }

    const { variant, label } = variants[status] || { variant: 'outline' as const, label: status }
    return (
      <Badge 
        variant={variant} 
        className="text-xs sm:text-sm"
        aria-label={`Estado del pago: ${label}`}
      >
        {label}
      </Badge>
    )
  }

  return (
    <main 
      role="main" 
      aria-labelledby="payment-history-title" 
      className="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-[95vw] mx-auto"
    >
      <Card>
        <CardHeader>
          <CardTitle id="payment-history-title" className="text-lg sm:text-xl">
            {t('billing.paymentHistory')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {t('billing.paymentHistoryDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Filters - Mobile First */}
          <section role="region" aria-labelledby="filters-title">
            <h2 id="filters-title" className="sr-only">Filtros de búsqueda</h2>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Search */}
              <div className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ID o descripción..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 min-h-[44px] text-sm sm:text-base touch-manipulation"
                    aria-label="Buscar pagos por ID o descripción"
                  />
                </div>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Status Filter */}
                <Select
                  value={statusFilter}
                  onValueChange={value => setStatusFilter(value as StatusFilter)}
                >
                  <SelectTrigger className="min-h-[44px] text-sm sm:text-base touch-manipulation">
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
                <Select
                  value={periodFilter}
                  onValueChange={value => setPeriodFilter(value as PeriodFilter)}
                >
                  <SelectTrigger className="min-h-[44px] text-sm sm:text-base touch-manipulation">
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
                <div className="flex gap-2 sm:col-span-2 lg:col-span-2">
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    className="flex-1 min-h-[44px] text-sm sm:text-base touch-manipulation"
                    aria-label="Exportar historial a CSV"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Exportar </span>CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportPDF}
                    className="flex-1 min-h-[44px] text-sm sm:text-base touch-manipulation"
                    aria-label="Exportar historial a PDF"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Exportar </span>PDF
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Results Count */}
          <div className="text-xs sm:text-sm text-muted-foreground">
            Mostrando {paginatedPayments.length} de {filteredPayments.length} transacciones
          </div>

          {/* Desktop Table - Hidden on Mobile */}
          <div className="hidden lg:block rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm font-medium">Fecha</TableHead>
                  <TableHead className="text-sm font-medium">ID Transacción</TableHead>
                  <TableHead className="text-sm font-medium">Descripción</TableHead>
                  <TableHead className="text-right text-sm font-medium">Monto</TableHead>
                  <TableHead className="text-sm font-medium">Estado</TableHead>
                  <TableHead className="text-right text-sm font-medium">Acciones</TableHead>
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
                  paginatedPayments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium text-sm">
                        {formatDate(payment.paid_at)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payment.id.substring(0, 12)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">
                            {payment.description || 'Pago de suscripción'}
                          </div>
                          {payment.failure_reason && (
                            <div className="text-xs text-destructive mt-1">
                              {payment.failure_reason}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        {formatCurrency(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-right">
                        {payment.invoice_pdf && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(payment.invoice_pdf)}
                            className="min-h-[36px] text-xs"
                          >
                            <Download className="h-3 w-3 mr-1" />
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

          {/* Mobile Cards - Shown on Mobile and Tablet */}
          <div className="lg:hidden space-y-3">
            {paginatedPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron pagos</p>
              </div>
            ) : (
              paginatedPayments.map(payment => (
                <Card key={payment.id} className="p-4 sm:p-5">
                  <div className="space-y-3">
                    {/* Header: Date + Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {formatDate(payment.paid_at)}
                      </span>
                      {getStatusBadge(payment.status)}
                    </div>

                    {/* Amount */}
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>

                    {/* Description */}
                    <div>
                      <div className="text-sm sm:text-base font-medium text-foreground">
                        {payment.description || 'Pago de suscripción'}
                      </div>
                      {payment.failure_reason && (
                        <div className="text-xs sm:text-sm text-destructive mt-1">
                          {payment.failure_reason}
                        </div>
                      )}
                    </div>

                    {/* Transaction ID */}
                    <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                      ID: {payment.id.substring(0, 12)}...
                    </div>

                    {/* Action Button */}
                    {payment.invoice_pdf && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadInvoice(payment.invoice_pdf)}
                        className="w-full min-h-[44px] text-sm sm:text-base touch-manipulation"
                        aria-label="Descargar factura del pago"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar Factura
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Pagination - Mobile Optimized */}
          {totalPages > 1 && (
            <section role="region" aria-labelledby="pagination-title">
              <h2 id="pagination-title" className="sr-only">Navegación de páginas</h2>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
                <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex-1 sm:flex-none min-h-[44px] text-sm sm:text-base touch-manipulation"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex-1 sm:flex-none min-h-[44px] text-sm sm:text-base touch-manipulation"
                    aria-label="Página siguiente"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </section>
          )}
        </CardContent>
      </Card>
    </main>
  )
}