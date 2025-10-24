// ============================================================================
// COMPONENT: AccountingPage
// Página completa de contabilidad con tabs para Configuración y Transacciones
// ============================================================================

import React, { Suspense, lazy, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calculator, FileText, Settings } from 'lucide-react'
import { SuspenseFallback } from '@/components/ui/loading-spinner'
import { useTransactions } from '@/hooks/useTransactions'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'

// Lazy load componentes pesados
const TaxConfiguration = lazy(() =>
  import('@/components/accounting/TaxConfiguration').then(module => ({
    default: module.TaxConfiguration,
  }))
)

const EnhancedTransactionForm = lazy(() =>
  import('@/components/transactions/EnhancedTransactionForm').then(module => ({
    default: module.EnhancedTransactionForm,
  }))
)

interface AccountingPageProps {
  businessId: string
  onUpdate?: () => void
}

export function AccountingPage({ businessId, onUpdate }: Readonly<AccountingPageProps>) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('config')
  const { createFiscalTransaction } = useTransactions()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          {t('accounting.title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('accounting.subtitle')}</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('accounting.tabs.taxConfig')}
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('accounting.tabs.transactions')}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Configuración Fiscal */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('accounting.sections.taxConfig')}</CardTitle>
              <CardDescription>{t('accounting.sections.configDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<SuspenseFallback text={t('accounting.sections.taxConfig')} />}>
                <TaxConfiguration businessId={businessId} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Transacciones */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('accounting.sections.transactions')}</CardTitle>
              <CardDescription>{t('accounting.sections.transactionDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={<SuspenseFallback text={t('accounting.sections.transactions')} />}
              >
                <EnhancedTransactionForm
                  businessId={businessId}
                  onSubmit={async transaction => {
                    try {
                      await createFiscalTransaction({
                        business_id: businessId,
                        type: transaction.type,
                        category: transaction.category,
                        subtotal: transaction.subtotal,
                        tax_type: transaction.tax_type,
                        tax_rate: transaction.tax_rate,
                        tax_amount: transaction.tax_amount,
                        total_amount: transaction.total_amount,
                        description: transaction.description,
                        appointment_id: transaction.appointment_id,
                        employee_id: transaction.employee_id,
                        transaction_date: transaction.transaction_date,
                        payment_method: transaction.payment_method,
                      })
                      toast.success(t('accounting.messages.saved'))
                      onUpdate?.()
                    } catch (error) {
                      toast.error(t('accounting.messages.error'))
                      throw error
                    }
                  }}
                  onCancel={() => {
                    // Opcional: cambiar a tab de lista de transacciones
                  }}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('accounting.cards.vat')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{t('accounting.cards.vatValue')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('accounting.cards.vatSubtitle')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('accounting.cards.ica')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{t('accounting.cards.icaValue')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('accounting.cards.icaSubtitle')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('accounting.cards.withholding')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {t('accounting.cards.withholdingValue')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('accounting.cards.withholdingSubtitle')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
