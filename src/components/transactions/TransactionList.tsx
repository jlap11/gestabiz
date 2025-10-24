import React, { useEffect, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Circle,
  DollarSign,
  Download,
  Filter,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTransactions } from '@/hooks/useTransactions'
import type { TransactionFilters } from '@/types/types'
import { cn } from '@/lib/utils'
import supabase from '@/lib/supabase'

interface TransactionListProps {
  businessId: string
  locationId?: string
  canVerify?: boolean // Admin can verify transactions
}

export function TransactionList({
  businessId,
  locationId,
  canVerify = false,
}: TransactionListProps) {
  const { t, language } = useLanguage()

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const formatDate = (date: Date, style: 'short' | 'long' = 'short') => {
    return new Intl.DateTimeFormat(language === 'es' ? 'es-MX' : 'en-US', {
      dateStyle: style === 'short' ? 'short' : 'medium',
    }).format(date)
  }

  const [filters, setFilters] = useState<TransactionFilters>({
    business_id: businessId,
    location_id: locationId,
    type: [],
    category: [],
  })

  const { transactions, summary, loading, verifyTransaction, refetch } = useTransactions(filters)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    refetch()
  }, [filters, refetch])

  const handleTypeFilter = (value: string) => {
    setSelectedType(value)
    if (value === 'all') {
      setFilters(prev => ({ ...prev, type: [] }))
    } else if (value === 'income') {
      setFilters(prev => ({ ...prev, type: ['income'] }))
    } else if (value === 'expense') {
      setFilters(prev => ({ ...prev, type: ['expense'] }))
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      transaction.description?.toLowerCase().includes(search) ||
      transaction.category.toLowerCase().includes(search)
    )
  })

  const handleExport = () => {
    // Create CSV export
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Currency', 'Status']
    const rows = filteredTransactions.map(t => [
      t.transaction_date,
      t.type,
      t.category,
      t.description || '',
      t.amount.toString(),
      t.currency,
      t.is_verified ? 'Verified' : 'Pending',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Total Income */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {t('transactions.totalIncome')}
            </span>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.total_income, 'MXN')}
          </div>
        </Card>

        {/* Total Expenses */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {t('transactions.totalExpenses')}
            </span>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(summary.total_expenses, 'MXN')}
          </div>
        </Card>

        {/* Net Profit */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {t('transactions.netProfit')}
            </span>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div
            className={cn(
              'text-2xl font-bold',
              summary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {formatCurrency(summary.net_profit, 'MXN')}
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('transactions.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 min-h-[44px] text-sm sm:text-base"
            />
          </div>

          {/* Type Filter */}
          <Select value={selectedType} onValueChange={handleTypeFilter}>
            <SelectTrigger className="w-full sm:w-48 min-h-[44px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('transactions.filterByType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('transactions.allTypes')}</SelectItem>
              <SelectItem value="income">{t('transactions.income')}</SelectItem>
              <SelectItem value="expense">{t('transactions.expense')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button variant="outline" onClick={handleExport} className="min-h-[44px]">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{t('common.export')}</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </Card>

      {/* Transactions - Desktop Table & Mobile Cards */}
      <Card>
        {/* Desktop Table - Hidden on Mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">{t('transactions.date')}</th>
                <th className="text-left p-4 font-medium">{t('transactions.type')}</th>
                <th className="text-left p-4 font-medium">{t('transactions.category')}</th>
                <th className="text-left p-4 font-medium">{t('transactions.description')}</th>
                <th className="text-right p-4 font-medium">{t('transactions.amount')}</th>
                <th className="text-center p-4 font-medium">{t('transactions.status')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {t('common.loading')}...
                  </td>
                </tr>
              )}

              {!loading && filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {searchTerm || selectedType !== 'all'
                      ? t('transactions.noResultsFound')
                      : t('transactions.noTransactions')}
                  </td>
                </tr>
              )}

              {!loading &&
                filteredTransactions.map(transaction => (
                  <tr key={transaction.id} className="border-b hover:bg-muted/30 transition-colors">
                    {/* Date */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(new Date(transaction.transaction_date), 'short')}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="p-4">
                      <Badge
                        variant={transaction.type === 'income' ? 'default' : 'destructive'}
                        className={cn(
                          'font-medium',
                          transaction.type === 'income' &&
                            'bg-green-100 text-green-700 hover:bg-green-200',
                          transaction.type === 'expense' &&
                            'bg-red-100 text-red-700 hover:bg-red-200'
                        )}
                      >
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {t(`transactions.${transaction.type}`)}
                      </Badge>
                    </td>

                    {/* Category */}
                    <td className="p-4 text-sm">
                      {t(`transactions.categories.${transaction.category}`)}
                    </td>

                    {/* Description */}
                    <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                      {transaction.description || '-'}
                    </td>

                    {/* Amount */}
                    <td className="p-4 text-right">
                      <span
                        className={cn(
                          'font-semibold',
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {transaction.is_verified ? (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {t('transactions.verified')}
                          </Badge>
                        ) : (
                          <>
                            <Badge variant="outline" className="gap-1">
                              <Circle className="h-3 w-3" />
                              {t('transactions.pending')}
                            </Badge>
                            {canVerify && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  // Get current user
                                  const {
                                    data: { user },
                                  } = await supabase.auth.getUser()
                                  if (user) {
                                    await verifyTransaction(transaction.id, user.id)
                                  }
                                }}
                              >
                                {t('transactions.verify')}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - Shown on Mobile Only */}
        <div className="md:hidden p-3 space-y-3">
          {loading && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {t('common.loading')}...
            </div>
          )}

          {!loading && filteredTransactions.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {searchTerm || selectedType !== 'all'
                ? t('transactions.noResultsFound')
                : t('transactions.noTransactions')}
            </div>
          )}

          {!loading &&
            filteredTransactions.map(transaction => (
              <Card
                key={transaction.id}
                className="p-4 border-l-4"
                style={{ borderLeftColor: transaction.type === 'income' ? '#10b981' : '#ef4444' }}
              >
                <div className="space-y-3">
                  {/* Header: Date + Type Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(new Date(transaction.transaction_date), 'short')}
                    </div>
                    <Badge
                      variant={transaction.type === 'income' ? 'default' : 'destructive'}
                      className={cn(
                        'text-[10px] font-medium',
                        transaction.type === 'income' && 'bg-green-100 text-green-700',
                        transaction.type === 'expense' && 'bg-red-100 text-red-700'
                      )}
                    >
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {t(`transactions.${transaction.type}`)}
                    </Badge>
                  </div>

                  {/* Amount - Large */}
                  <div
                    className="text-2xl font-bold"
                    style={{ color: transaction.type === 'income' ? '#10b981' : '#ef4444' }}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </div>

                  {/* Category */}
                  <div className="text-sm">
                    <span className="text-muted-foreground">{t('transactions.category')}:</span>
                    <span className="ml-2 font-medium">
                      {t(`transactions.categories.${transaction.category}`)}
                    </span>
                  </div>

                  {/* Description */}
                  {transaction.description && (
                    <div className="text-xs text-muted-foreground">{transaction.description}</div>
                  )}

                  {/* Status */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    {transaction.is_verified ? (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('transactions.verified')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Circle className="h-3 w-3" />
                        {t('transactions.pending')}
                      </Badge>
                    )}

                    {canVerify && !transaction.is_verified && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          const {
                            data: { user },
                          } = await supabase.auth.getUser()
                          if (user) {
                            await verifyTransaction(transaction.id, user.id)
                          }
                        }}
                        className="min-h-[44px] text-xs"
                      >
                        {t('transactions.verify')}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </Card>
    </div>
  )
}
