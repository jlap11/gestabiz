import { FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DocumentTypeSelect } from '@/components/catalog/DocumentTypeSelect'
import type { LegalEntityType } from '@/types/types'

interface LegalInfoFormProps {
  legalEntityType: LegalEntityType
  documentTypeId: string
  taxId: string
  legalName: string
  registrationNumber: string
  country: string
  onLegalEntityTypeChange: (type: LegalEntityType) => void
  onDocumentTypeChange: (value: string) => void
  onTaxIdChange: (value: string) => void
  onLegalNameChange: (value: string) => void
  onRegistrationNumberChange: (value: string) => void
}

export function LegalInfoForm({
  legalEntityType,
  documentTypeId,
  taxId,
  legalName,
  registrationNumber,
  country,
  onLegalEntityTypeChange,
  onDocumentTypeChange,
  onTaxIdChange,
  onLegalNameChange,
  onRegistrationNumberChange,
}: LegalInfoFormProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5 text-primary" />
          Información Legal
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Información legal y tributaria del negocio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legal Entity Type */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">
            Tipo de entidad legal
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="relative">
              <input
                type="radio"
                name="legal_entity_type"
                value="company"
                checked={legalEntityType === 'company'}
                onChange={e => onLegalEntityTypeChange(e.target.value as LegalEntityType)}
                className="sr-only peer"
              />
              <div className="border-2 border-border rounded-lg p-4 cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50">
                <div className="font-medium text-foreground">Empresa</div>
                <div className="text-sm text-muted-foreground">
                  Sociedad, SAS, Ltda, etc.
                </div>
              </div>
            </label>
            <label className="relative">
              <input
                type="radio"
                name="legal_entity_type"
                value="individual"
                checked={legalEntityType === 'individual'}
                onChange={e => onLegalEntityTypeChange(e.target.value as LegalEntityType)}
                className="sr-only peer"
              />
              <div className="border-2 border-border rounded-lg p-4 cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50">
                <div className="font-medium text-foreground">Persona Natural</div>
                <div className="text-sm text-muted-foreground">
                  Persona natural con cédula
                </div>
              </div>
            </label>
          </div>
        </fieldset>

        {/* Document Type */}
        <div className="space-y-2">
          <label htmlFor="doc-type" className="text-sm font-medium text-foreground">
            Tipo de documento
          </label>
          {legalEntityType === 'company' ? (
            <Input
              id="doc-type"
              value="NIT"
              disabled
              className="bg-background border-border"
            />
          ) : (
            <DocumentTypeSelect
              countryId={
                country === 'Colombia'
                  ? '01b4e9d1-a84e-41c9-8768-253209225a21'
                  : country
              }
              value={documentTypeId}
              onChange={onDocumentTypeChange}
              forCompany={false}
              className="bg-background border-border"
            />
          )}
          <p className="text-xs text-muted-foreground">
            {legalEntityType === 'company'
              ? 'Tipo de documento fijado para empresas'
              : 'Selecciona el tipo de documento apropiado para tu negocio'}
          </p>
        </div>

        {/* Tax ID / Document Number */}
        <div className="space-y-2">
          <label htmlFor="tax_id" className="text-sm font-medium text-foreground">
            Número de documento
          </label>
          <Input
            id="tax_id"
            value={taxId}
            onChange={e => onTaxIdChange(e.target.value.replaceAll(/\D/g, ''))}
            placeholder={
              legalEntityType === 'company'
                ? 'Ej: 900123456'
                : 'Ej: 1234567890'
            }
            className="bg-background border-border"
          />
          <p className="text-xs text-muted-foreground">
            {legalEntityType === 'company'
              ? 'Número de Identificación Tributaria (9-10 dígitos)'
              : 'Número de documento de identidad (6-10 dígitos)'}
          </p>
        </div>

        {/* Legal Name */}
        <div className="space-y-2">
          <label htmlFor="legal_name" className="text-sm font-medium text-foreground">
            {legalEntityType === 'company'
              ? 'Razón Social'
              : 'Nombre Completo'}
          </label>
          <Input
            id="legal_name"
            value={legalName}
            onChange={e => onLegalNameChange(e.target.value)}
            placeholder={
              legalEntityType === 'company'
                ? 'Ej: Salón de Belleza María S.A.S.'
                : 'Ej: María Pérez González'
            }
            className="bg-background border-border"
          />
        </div>

        {/* Registration Number (only for companies) */}
        {legalEntityType === 'company' && (
          <div className="space-y-2">
            <label
              htmlFor="registration_number"
              className="text-sm font-medium text-foreground"
            >
              Registro Mercantil (opcional)
            </label>
            <Input
              id="registration_number"
              value={registrationNumber}
              onChange={e => onRegistrationNumberChange(e.target.value)}
              placeholder="Número de registro en Cámara de Comercio"
              className="bg-background border-border"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}