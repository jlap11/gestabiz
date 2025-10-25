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
    <main 
      role="main" 
      aria-labelledby="accounting-page-title"
      className="space-y-4 sm:space-y-6 max-w-[100vw] overflow-x-hidden"
    >
      {/* Screen reader only title */}
      <h1 id="accounting-page-title" className="sr-only">
        {t('accounting.title')}
      </h1>

      {/* Header */}
      <header className="space-y-2">
        <h2 
          className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2"
          aria-describedby="accounting-page-subtitle"
        >
          <Calculator className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          {t('accounting.title')}
        </h2>
        <p 
          id="accounting-page-subtitle"
          className="text-sm text-muted-foreground"
        >
          {t('accounting.subtitle')}
        </p>
      </header>

      {/* Tabs */}
      <section 
        role="region" 
        aria-labelledby="accounting-tabs-heading"
        className="space-y-4"
      >
        <h3 id="accounting-tabs-heading" className="sr-only">
          Secciones de contabilidad
        </h3>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList 
            className="grid w-full grid-cols-2 h-auto"
            role="tablist"
            aria-label="Secciones de contabilidad"
          >
            <TabsTrigger 
              value="config" 
              className="flex items-center gap-2 min-h-[44px] px-3 py-2 text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              role="tab"
              aria-selected={activeTab === 'config'}
              aria-controls="config-panel"
              id="config-tab"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">{t('accounting.tabs.taxConfig')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="flex items-center gap-2 min-h-[44px] px-3 py-2 text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              role="tab"
              aria-selected={activeTab === 'transactions'}
              aria-controls="transactions-panel"
              id="transactions-tab"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">{t('accounting.tabs.transactions')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Configuración Fiscal */}
          <TabsContent 
            value="config" 
            className="space-y-4 mt-4 sm:mt-6"
            role="tabpanel"
            aria-labelledby="config-tab"
            id="config-panel"
            tabIndex={0}
          >
            <Card className="focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <CardHeader className="space-y-2 p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  {t('accounting.sections.taxConfig')}
                </CardTitle>
                <CardDescription className="text-sm">
                  {t('accounting.sections.configDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <Suspense fallback={<SuspenseFallback text={t('accounting.sections.taxConfig')} />}>
                  <TaxConfiguration businessId={businessId} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Transacciones */}
          <TabsContent 
            value="transactions" 
            className="space-y-4 mt-4 sm:mt-6"
            role="tabpanel"
            aria-labelledby="transactions-tab"
            id="transactions-panel"
            tabIndex={0}
          >
            <Card className="focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <CardHeader className="space-y-2 p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  {t('accounting.sections.transactions')}
                </CardTitle>
                <CardDescription className="text-sm">
                  {t('accounting.sections.transactionDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
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
      </section>

      {/* Info Cards */}
      <section 
        role="region" 
        aria-labelledby="tax-info-heading"
        className="space-y-4"
      >
        <h3 id="tax-info-heading" className="sr-only">
          Información fiscal
        </h3>
        
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
          role="list"
          aria-label="Información de impuestos"
        >
          <Card 
            className="focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            role="listitem"
            tabIndex={0}
            aria-labelledby="vat-card-title"
            aria-describedby="vat-card-description"
          >
            <CardHeader className="pb-3 p-4 sm:p-6">
              <CardTitle 
                id="vat-card-title"
                className="text-sm font-medium text-muted-foreground"
              >
                {t('accounting.cards.vat')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p 
                className="text-xl sm:text-2xl font-bold text-foreground"
                aria-label={`IVA: ${t('accounting.cards.vatValue')}`}
              >
                {t('accounting.cards.vatValue')}
              </p>
              <p 
                id="vat-card-description"
                className="text-xs text-muted-foreground mt-1"
              >
                {t('accounting.cards.vatSubtitle')}
              </p>
            </CardContent>
          </Card>

          <Card 
            className="focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            role="listitem"
            tabIndex={0}
            aria-labelledby="ica-card-title"
            aria-describedby="ica-card-description"
          >
            <CardHeader className="pb-3 p-4 sm:p-6">
              <CardTitle 
                id="ica-card-title"
                className="text-sm font-medium text-muted-foreground"
              >
                {t('accounting.cards.ica')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p 
                className="text-xl sm:text-2xl font-bold text-foreground"
                aria-label={`ICA: ${t('accounting.cards.icaValue')}`}
              >
                {t('accounting.cards.icaValue')}
              </p>
              <p 
                id="ica-card-description"
                className="text-xs text-muted-foreground mt-1"
              >
                {t('accounting.cards.icaSubtitle')}
              </p>
            </CardContent>
          </Card>

          <Card 
            className="focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 sm:col-span-2 lg:col-span-1"
            role="listitem"
            tabIndex={0}
            aria-labelledby="withholding-card-title"
            aria-describedby="withholding-card-description"
          >
            <CardHeader className="pb-3 p-4 sm:p-6">
              <CardTitle 
                id="withholding-card-title"
                className="text-sm font-medium text-muted-foreground"
              >
                {t('accounting.cards.withholding')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p 
                className="text-xl sm:text-2xl font-bold text-foreground"
                aria-label={`Retención: ${t('accounting.cards.withholdingValue')}`}
              >
                {t('accounting.cards.withholdingValue')}
              </p>
              <p 
                id="withholding-card-description"
                className="text-xs text-muted-foreground mt-1"
              >
                {t('accounting.cards.withholdingSubtitle')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}