import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

// Country codes with flags
const COUNTRY_CODES = [
  { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'Estados Unidos' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'México' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'España' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '+51', country: 'PE', flag: '🇵🇪', name: 'Perú' },
  { code: '+593', country: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+58', country: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brasil' },
  { code: '+598', country: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+595', country: 'PY', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+591', country: 'BO', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+506', country: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+507', country: 'PA', flag: '🇵🇦', name: 'Panamá' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'Reino Unido' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'Francia' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Alemania' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italia' },
] as const

interface PhoneInputProps {
  value: string // Full phone with prefix (e.g., "+57 3001234567")
  onChange: (value: string) => void
  prefix?: string // Current prefix (e.g., "+57")
  onPrefixChange?: (prefix: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function PhoneInput({
  value,
  onChange,
  prefix = '+57',
  onPrefixChange,
  placeholder = 'Número de teléfono',
  disabled = false,
  className = '',
}: PhoneInputProps) {
  // Extract number part (remove prefix if present)
  const getNumberPart = () => {
    if (!value) return ''
    
    // Remove all non-digits
    const digitsOnly = value.replace(/\D/g, '')
    
    // Remove prefix digits if present
    const prefixDigits = prefix.replace(/\D/g, '')
    if (digitsOnly.startsWith(prefixDigits)) {
      return digitsOnly.slice(prefixDigits.length)
    }
    
    return digitsOnly
  }

  const handlePrefixChange = (newPrefix: string) => {
    onPrefixChange?.(newPrefix)
    
    // Update full value with new prefix
    const numberPart = getNumberPart()
    if (numberPart) {
      onChange(`${newPrefix} ${numberPart}`)
    }
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const digitsOnly = e.target.value.replace(/\D/g, '')
    
    // Update full value
    if (digitsOnly) {
      onChange(`${prefix} ${digitsOnly}`)
    } else {
      onChange('')
    }
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Prefix Selector */}
      <Select value={prefix} onValueChange={handlePrefixChange} disabled={disabled}>
        <SelectTrigger className="w-[140px] bg-[#1a1a1a] border-white/10">
          <SelectValue>
            {COUNTRY_CODES.find(c => c.code === prefix) ? (
              <span className="flex items-center gap-2">
                <span className="text-lg">{COUNTRY_CODES.find(c => c.code === prefix)?.flag}</span>
                <span className="text-sm">{prefix}</span>
              </span>
            ) : (
              prefix
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {COUNTRY_CODES.map((country) => (
            <SelectItem key={country.country} value={country.code}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{country.flag}</span>
                <span className="text-sm">{country.code}</span>
                <span className="text-xs text-gray-400">{country.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Number Input */}
      <Input
        type="tel"
        value={getNumberPart()}
        onChange={handleNumberChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-[#1a1a1a] border-white/10"
        maxLength={15} // Max 15 digits for phone number
      />
    </div>
  )
}
