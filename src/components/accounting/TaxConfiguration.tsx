import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import { useBusinessTaxConfig } from '@/hooks/useBusinessTaxConfig'
import { COLOMBIAN_CITIES_ICA, RETENTION_CONFIGS } from '@/lib/accounting/colombiaTaxes'
import { AlertCircle, DollarSign, FileText, RefreshCw, Save, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TaxConfigurationProps {
  businessId: string
}

export function TaxConfiguration({ businessId }: TaxConfigurationProps) {
  const { t } = useLanguage()
  const { config: taxConfig, loading, updateConfig, refetch } = useBusinessTaxConfig(businessId)

  // Estados del formulario
  const [taxRegime, setTaxRegime] = useState<'simple' | 'common' | 'special'>('common')
  const [cityCode, setCityCode] = useState('')
  const [ivaEnabled, setIvaEnabled] = useState(true)
  const [ivaRate, setIvaRate] = useState(19)
  const [icaEnabled, setIcaEnabled] = useState(true)
  const [icaRate, setIcaRate] = useState(0)
  const [retentionEnabled, setRetentionEnabled] = useState(false)
  const [retentionType, setRetentionType] = useState('')
  const [retentionRate, setRetentionRate] = useState(0)
  const [taxIdNumber, setTaxIdNumber] = useState('')
  const [hasConfig, setHasConfig] = useState(false)

  // Cargar configuración existente
  useEffect(() => {
    if (taxConfig) {
      setHasConfig(true)
      setTaxRegime(taxConfig.tax_regime)
      setCityCode('') // No hay city_dane_code en el nuevo esquema
      setIvaEnabled(taxConfig.is_iva_responsible)
      setIvaRate(taxConfig.default_iva_rate)
      setIcaEnabled(taxConfig.is_ica_responsible)
      setIcaRate(taxConfig.ica_rate)
      setRetentionEnabled(taxConfig.is_retention_agent)
      setRetentionType('') // No hay retention_type en el nuevo esquema
      setRetentionRate(taxConfig.retention_rate)
      setTaxIdNumber(taxConfig.dian_code || '')
    }
  }, [taxConfig])

  // Actualizar ICA rate cuando cambia la ciudad
  useEffect(() => {
    if (cityCode) {
      const city = COLOMBIAN_CITIES_ICA.find(c => c.dane_code === cityCode)
      if (city) {
        setIcaRate(city.ica_rate)
      }
    }
  }, [cityCode])

  // Actualizar retention rate cuando cambia el tipo
  useEffect(() => {
    if (retentionType) {
      const config = RETENTION_CONFIGS.find(r => r.activity_code === retentionType)
      if (config) {
        setRetentionRate(config.retention_rate)
      }
    }
  }, [retentionType])

  const handleSave = async () => {
    const toastId = toast.loading(t('common.messages.saving'))
    try {
      const configData = {
        business_id: businessId,
        tax_regime: taxRegime,
        is_iva_responsible: ivaEnabled,
        default_iva_rate: ivaRate,
        is_ica_responsible: icaEnabled,
        ica_rate: icaRate,
        is_retention_agent: retentionEnabled,
        retention_rate: retentionRate,
        dian_code: taxIdNumber || undefined,
      }

      await updateConfig(configData)
      setHasConfig(true)
      toast.success(t('common.messages.saveSuccess'), { id: toastId })
    } catch (error) {
      toast.error(
        t('common.messages.saveError') + `: ${error instanceof Error ? error.message : 'Error'}`,
        { id: toastId }
      )
      throw error
    }
  }

  const handleReset = () => {
    refetch()
    if (taxConfig) {
      setTaxRegime(taxConfig.tax_regime)
      setCityCode('') // No hay city_dane_code en el nuevo esquema
      setIvaEnabled(taxConfig.is_iva_responsible)
      setIvaRate(taxConfig.default_iva_rate)
      setIcaEnabled(taxConfig.is_ica_responsible)
      setIcaRate(taxConfig.ica_rate)
      setRetentionEnabled(taxConfig.is_retention_agent)
      setRetentionType('') // No hay retention_type en el nuevo esquema
      setRetentionRate(taxConfig.retention_rate)
      setTaxIdNumber(taxConfig.dian_code || '')
    }
    toast.success(t('taxConfiguration.resetSuccess'))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6" />
            {t('taxConfiguration.title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t('taxConfiguration.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={loading || !hasConfig}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.actions.reset')}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {hasConfig ? t('common.actions.update') : t('common.actions.save')}
          </Button>
        </div>
      </div>

      {/* Aviso de régimen simplificado */}
      {taxRegime === 'simple' && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                {t('taxConfiguration.alerts.simpleRegimeTitle')}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                {t('taxConfiguration.alerts.simpleRegimeDescription')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs de configuración */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="general">
            <FileText className="h-4 w-4 mr-2" />
            {t('taxConfiguration.tabs.general')}
          </TabsTrigger>
          <TabsTrigger value="iva">
            <DollarSign className="h-4 w-4 mr-2" />
            {t('taxConfiguration.tabs.iva')}
          </TabsTrigger>
          <TabsTrigger value="ica">
            <DollarSign className="h-4 w-4 mr-2" />
            {t('taxConfiguration.tabs.ica')}
          </TabsTrigger>
          <TabsTrigger value="retention">
            <DollarSign className="h-4 w-4 mr-2" />
            {t('taxConfiguration.tabs.retention')}
          </TabsTrigger>
        </TabsList>

        {/* Tab General */}
        <TabsContent value="general" className="space-y-4">
          <Card className="p-6 bg-card">
            <div className="space-y-4">
              {/* Régimen Tributario */}
              <div className="space-y-2">
                <Label htmlFor="tax-regime">{t('taxConfiguration.general.taxRegime')}</Label>
                <Select value={taxRegime} onValueChange={v => setTaxRegime(v as typeof taxRegime)}>
                  <SelectTrigger id="tax-regime">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">
                      {t('taxConfiguration.general.regimes.common')}
                    </SelectItem>
                    <SelectItem value="simple">
                      {t('taxConfiguration.general.regimes.simple')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('taxConfiguration.general.taxRegimeDescription')}
                </p>
              </div>

              {/* NIT */}
              <div className="space-y-2">
                <Label htmlFor="tax-id">{t('taxConfiguration.general.taxId')}</Label>
                <Input
                  id="tax-id"
                  type="text"
                  value={taxIdNumber}
                  onChange={e => setTaxIdNumber(e.target.value)}
                  placeholder={t('taxConfiguration.general.taxIdPlaceholder')}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  {t('taxConfiguration.general.taxIdDescription')}
                </p>
              </div>

              {/* Ciudad */}
              <div className="space-y-2">
                <Label htmlFor="city">{t('taxConfiguration.general.city')}</Label>
                <Select value={cityCode} onValueChange={setCityCode}>
                  <SelectTrigger id="city">
                    <SelectValue placeholder={t('common.placeholders.selectCity')} />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOMBIAN_CITIES_ICA.map(city => (
                      <SelectItem key={city.dane_code} value={city.dane_code}>
                        {city.city} - {(city.ica_rate * 100).toFixed(3)}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('taxConfiguration.general.cityDescription')}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab IVA */}
        <TabsContent value="iva" className="space-y-4">
          <Card className="p-6 bg-card">
            <div className="space-y-4">
              {/* Habilitar IVA */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="iva-enabled">{t('taxConfiguration.iva.enable')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('taxConfiguration.iva.description')}
                  </p>
                </div>
                <Switch
                  id="iva-enabled"
                  checked={ivaEnabled && taxRegime === 'common'}
                  onCheckedChange={setIvaEnabled}
                  disabled={taxRegime === 'simple'}
                />
              </div>

              {/* Tasa de IVA */}
              {ivaEnabled && taxRegime === 'common' && (
                <div className="space-y-2">
                  <Label htmlFor="iva-rate">{t('taxConfiguration.iva.rate')}</Label>
                  <Select value={ivaRate.toString()} onValueChange={v => setIvaRate(Number(v))}>
                    <SelectTrigger id="iva-rate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t('taxConfiguration.iva.rates.exempt')}</SelectItem>
                      <SelectItem value="5">{t('taxConfiguration.iva.rates.basic')}</SelectItem>
                      <SelectItem value="19">{t('taxConfiguration.iva.rates.general')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('taxConfiguration.iva.rateDescription')}
                  </p>
                </div>
              )}

              {/* Info box */}
              <Card className="p-4 bg-muted border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>{t('common.note')}:</strong> {t('taxConfiguration.iva.infoNote')}
                </p>
              </Card>
            </div>
          </Card>
        </TabsContent>

        {/* Tab ICA */}
        <TabsContent value="ica" className="space-y-4">
          <Card className="p-6 bg-card">
            <div className="space-y-4">
              {/* Habilitar ICA */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ica-enabled">{t('taxConfiguration.ica.enable')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('taxConfiguration.ica.description')}
                  </p>
                </div>
                <Switch id="ica-enabled" checked={icaEnabled} onCheckedChange={setIcaEnabled} />
              </div>

              {/* Tasa de ICA (calculada automáticamente) */}
              {icaEnabled && (
                <div className="space-y-2">
                  <Label>{t('taxConfiguration.ica.rate')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={`${(icaRate * 100).toFixed(3)}%`}
                      disabled
                      className="bg-muted"
                    />
                    <span className="text-sm text-muted-foreground">
                      {t('taxConfiguration.ica.rateCalculated')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('taxConfiguration.ica.selectCityHint')}
                  </p>
                </div>
              )}

              {/* Info box */}
              <Card className="p-4 bg-muted border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>{t('taxConfiguration.ica.cityRates')}</strong>
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  <li>• Bogotá: 0.966% - 1.38%</li>
                  <li>• Medellín: 1.0%</li>
                  <li>• Cali: 1.0%</li>
                  <li>• Barranquilla: 0.7%</li>
                  <li>• Cartagena: 0.8%</li>
                </ul>
              </Card>
            </div>
          </Card>
        </TabsContent>

        {/* Tab Retención */}
        <TabsContent value="retention" className="space-y-4">
          <Card className="p-6 bg-card">
            <div className="space-y-4">
              {/* Habilitar Retención */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="retention-enabled">
                    {t('taxConfiguration.retention.enable')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('taxConfiguration.retention.description')}
                  </p>
                </div>
                <Switch
                  id="retention-enabled"
                  checked={retentionEnabled}
                  onCheckedChange={setRetentionEnabled}
                />
              </div>

              {/* Tipo de Retención */}
              {retentionEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="retention-type">
                      {t('taxConfiguration.retention.activityType')}
                    </Label>
                    <Select value={retentionType} onValueChange={setRetentionType}>
                      <SelectTrigger id="retention-type">
                        <SelectValue placeholder={t('common.placeholders.selectActivityType')} />
                      </SelectTrigger>
                      <SelectContent>
                        {RETENTION_CONFIGS.map(config => (
                          <SelectItem key={config.activity_code} value={config.activity_code}>
                            {config.description} - {(config.retention_rate * 100).toFixed(1)}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tasa de Retención */}
                  {retentionType && (
                    <div className="space-y-2">
                      <Label>{t('taxConfiguration.retention.rate')}</Label>
                      <Input
                        type="text"
                        value={`${(retentionRate * 100).toFixed(1)}%`}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('taxConfiguration.retention.rateDescription')}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Info box */}
              <Card className="p-4 bg-muted border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>{t('common.note')}:</strong> {t('taxConfiguration.retention.infoNote')}
                </p>
              </Card>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resumen de configuración */}
      <Card className="p-6 bg-card">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          {t('taxConfiguration.summary.title')}
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('taxConfiguration.summary.regime')}</span>
              <span className="font-medium text-foreground">
                {taxRegime === 'common'
                  ? t('taxConfiguration.general.regimes.common')
                  : taxRegime === 'simple'
                    ? t('taxConfiguration.general.regimes.simple')
                    : t('taxConfiguration.general.regimes.special')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('taxConfiguration.summary.taxId')}</span>
              <span className="font-medium text-foreground">
                {taxIdNumber || t('taxConfiguration.summary.notConfigured')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('taxConfiguration.summary.city')}</span>
              <span className="font-medium text-foreground">
                {cityCode
                  ? COLOMBIAN_CITIES_ICA.find(c => c.dane_code === cityCode)?.city
                  : t('taxConfiguration.summary.notSelected')}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('taxConfiguration.tabs.iva')}:</span>
              <span
                className={cn(
                  'font-medium',
                  ivaEnabled && taxRegime === 'common'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {ivaEnabled && taxRegime === 'common'
                  ? `${t('taxConfiguration.summary.active')} (${ivaRate}%)`
                  : t('taxConfiguration.summary.inactive')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('taxConfiguration.tabs.ica')}:</span>
              <span
                className={cn(
                  'font-medium',
                  icaEnabled
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {icaEnabled
                  ? `${t('taxConfiguration.summary.active')} (${(icaRate * 100).toFixed(3)}%)`
                  : t('taxConfiguration.summary.inactive')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('taxConfiguration.tabs.retention')}:</span>
              <span
                className={cn(
                  'font-medium',
                  retentionEnabled
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {retentionEnabled
                  ? `${t('taxConfiguration.summary.active')} (${(retentionRate * 100).toFixed(1)}%)`
                  : t('taxConfiguration.summary.inactive')}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
