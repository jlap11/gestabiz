import { Mail, Phone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CitySelect, PhonePrefixSelect, RegionSelect } from '@/components/catalog'

interface ContactInfoFormProps {
  phone: string
  email: string
  address: string
  country: string
  countryId: string
  regionId: string
  cityId: string
  phonePrefix: string
  onPhoneChange: (value: string) => void
  onEmailChange: (value: string) => void
  onAddressChange: (value: string) => void
  onCountryChange: (value: string) => void
  onRegionChange: (value: string) => void
  onCityChange: (value: string) => void
  onPhonePrefixChange: (value: string) => void
}

export function ContactInfoForm({
  phone,
  email,
  address,
  country,
  countryId,
  regionId,
  cityId,
  phonePrefix,
  onPhoneChange,
  onEmailChange,
  onAddressChange,
  onCountryChange,
  onRegionChange,
  onCityChange,
  onPhonePrefixChange,
}: ContactInfoFormProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Phone className="h-5 w-5 text-primary" />
          Información de Contacto
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Datos de contacto y ubicación del negocio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phone */}
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Teléfono
          </label>
          <div className="flex gap-2">
            <PhonePrefixSelect
              value={phonePrefix}
              onChange={onPhonePrefixChange}
              className="w-32 bg-background border-border"
              defaultToColombia
            />
            <Input
              id="phone"
              value={phone}
              onChange={e => onPhoneChange(e.target.value.replaceAll(/\D/g, ''))}
              placeholder="Número de teléfono"
              className="flex-1 bg-background border-border"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => onEmailChange(e.target.value)}
            placeholder="contacto@tuempresa.com"
            className="bg-background border-border"
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label htmlFor="address" className="text-sm font-medium">
            Dirección
          </label>
          <Input
            id="address"
            value={address}
            onChange={e => onAddressChange(e.target.value)}
            placeholder="Calle, número, colonia"
            className="bg-background border-border"
          />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <label htmlFor="country" className="text-sm font-medium">
            País
          </label>
          <Input
            id="country"
            value={country}
            onChange={e => onCountryChange(e.target.value)}
            placeholder="Colombia"
            disabled
            className="bg-background border-border"
          />
        </div>

        {/* State/Department */}
        <div className="space-y-2">
          <label htmlFor="state" className="text-sm font-medium">
            Departamento
          </label>
          <RegionSelect
            countryId={countryId}
            value={regionId}
            onChange={value => {
              onRegionChange(value)
              // Reset city when department changes
              onCityChange('')
            }}
            placeholder="Seleccione un departamento"
            className="bg-background border-border"
          />
        </div>

        {/* City */}
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm font-medium">
            Ciudad
          </label>
          <CitySelect
            regionId={regionId}
            value={cityId}
            onChange={onCityChange}
            placeholder="Seleccione una ciudad"
            className="bg-background border-border"
          />
        </div>
      </CardContent>
    </Card>
  )
}