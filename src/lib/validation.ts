import { ERROR_MESSAGES, REGEX_PATTERNS } from '@/constants'

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

// Individual field validators
export const validators = {
  required: (value: unknown): ValidationResult => {
    const isValid = value !== null && value !== undefined && value !== ''
    return {
      isValid,
      error: isValid ? undefined : ERROR_MESSAGES.REQUIRED_FIELD,
    }
  },

  email: (value: string): ValidationResult => {
    if (!value) return { isValid: true } // Optional field
    const isValid = REGEX_PATTERNS.EMAIL.test(value)
    return {
      isValid,
      error: isValid ? undefined : ERROR_MESSAGES.INVALID_EMAIL,
    }
  },

  phone: (value: string): ValidationResult => {
    if (!value) return { isValid: true } // Optional field
    const isValid = REGEX_PATTERNS.PHONE.test(value.replace(/[\s\-\(\)]/g, ''))
    return {
      isValid,
      error: isValid ? undefined : ERROR_MESSAGES.INVALID_PHONE,
    }
  },

  time: (value: string): ValidationResult => {
    if (!value) return { isValid: true } // Optional field
    const isValid = REGEX_PATTERNS.TIME_24H.test(value)
    return {
      isValid,
      error: isValid ? undefined : ERROR_MESSAGES.INVALID_TIME,
    }
  },

  postalCode: (value: string): ValidationResult => {
    if (!value) return { isValid: true } // Optional field
    const isValid = REGEX_PATTERNS.POSTAL_CODE.test(value)
    return {
      isValid,
      error: isValid ? undefined : 'Código postal inválido',
    }
  },

  minLength:
    (min: number) =>
    (value: string): ValidationResult => {
      if (!value) return { isValid: true } // Optional field
      const isValid = value.length >= min
      return {
        isValid,
        error: isValid ? undefined : `Debe tener al menos ${min} caracteres`,
      }
    },

  maxLength:
    (max: number) =>
    (value: string): ValidationResult => {
      if (!value) return { isValid: true } // Optional field
      const isValid = value.length <= max
      return {
        isValid,
        error: isValid ? undefined : `Debe tener máximo ${max} caracteres`,
      }
    },

  min:
    (min: number) =>
    (value: number): ValidationResult => {
      const isValid = value >= min
      return {
        isValid,
        error: isValid ? undefined : `Debe ser mayor o igual a ${min}`,
      }
    },

  max:
    (max: number) =>
    (value: number): ValidationResult => {
      const isValid = value <= max
      return {
        isValid,
        error: isValid ? undefined : `Debe ser menor o igual a ${max}`,
      }
    },

  url: (value: string): ValidationResult => {
    if (!value) return { isValid: true } // Optional field
    try {
      new URL(value)
      return { isValid: true }
    } catch {
      return {
        isValid: false,
        error: 'URL inválida',
      }
    }
  },

  password: (value: string): ValidationResult => {
    if (!value) return { isValid: true } // Optional field
    const isValid = value.length >= 8
    return {
      isValid,
      error: isValid ? undefined : ERROR_MESSAGES.PASSWORD_TOO_SHORT,
    }
  },

  passwordConfirmation:
    (password: string) =>
    (confirmation: string): ValidationResult => {
      const isValid = password === confirmation
      return {
        isValid,
        error: isValid ? undefined : 'Las contraseñas no coinciden',
      }
    },

  date: (value: string): ValidationResult => {
    if (!value) return { isValid: true } // Optional field
    const date = new Date(value)
    const isValid = !isNaN(date.getTime())
    return {
      isValid,
      error: isValid ? undefined : 'Fecha inválida',
    }
  },

  futureDate: (value: string): ValidationResult => {
    if (!value) return { isValid: true } // Optional field
    const date = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isValid = date >= today
    return {
      isValid,
      error: isValid ? undefined : 'La fecha debe ser hoy o en el futuro',
    }
  },

  businessHours: (open: string, close: string): ValidationResult => {
    if (!open || !close) return { isValid: true }

    const [openHour, openMin] = open.split(':').map(Number)
    const [closeHour, closeMin] = close.split(':').map(Number)

    const openMinutes = openHour * 60 + openMin
    const closeMinutes = closeHour * 60 + closeMin

    const isValid = closeMinutes > openMinutes
    return {
      isValid,
      error: isValid ? undefined : 'La hora de cierre debe ser posterior a la de apertura',
    }
  },
}

// Validation schema builder
export class ValidationSchema {
  private rules: Record<string, Array<(value: unknown) => ValidationResult>> = {}

  field(name: string) {
    if (!this.rules[name]) {
      this.rules[name] = []
    }
    return {
      field: (nextName: string) => {
        return this.field(nextName)
      },
      required: () => {
        this.rules[name].push(validators.required)
        return this.field(name)
      },
      email: () => {
        this.rules[name].push(validators.email)
        return this.field(name)
      },
      phone: () => {
        this.rules[name].push(validators.phone)
        return this.field(name)
      },
      time: () => {
        this.rules[name].push(validators.time)
        return this.field(name)
      },
      date: () => {
        this.rules[name].push(validators.date)
        return this.field(name)
      },
      futureDate: () => {
        this.rules[name].push(validators.futureDate)
        return this.field(name)
      },
      minLength: (min: number) => {
        this.rules[name].push(validators.minLength(min))
        return this.field(name)
      },
      maxLength: (max: number) => {
        this.rules[name].push(validators.maxLength(max))
        return this.field(name)
      },
      min: (min: number) => {
        this.rules[name].push(validators.min(min))
        return this.field(name)
      },
      max: (max: number) => {
        this.rules[name].push(validators.max(max))
        return this.field(name)
      },
      url: () => {
        this.rules[name].push(validators.url)
        return this.field(name)
      },
      password: () => {
        this.rules[name].push(validators.password)
        return this.field(name)
      },
      custom: (validator: (value: unknown) => ValidationResult) => {
        this.rules[name].push(validator)
        return this.field(name)
      },
    }
  }

  validate(data: Record<string, unknown>): FormValidationResult {
    const errors: Record<string, string> = {}
    let isValid = true

    for (const [fieldName, fieldRules] of Object.entries(this.rules)) {
      const value = data[fieldName]

      for (const rule of fieldRules) {
        const result = rule(value)
        if (!result.isValid && result.error) {
          errors[fieldName] = result.error
          isValid = false
          break // Stop at first error for this field
        }
      }
    }

    return { isValid, errors }
  }
}

// Predefined schemas for common forms
export const appointmentSchema = new ValidationSchema()
  .field('client_name')
  .required()
  .minLength(2)
  .maxLength(100)
  .field('client_email')
  .email()
  .field('client_phone')
  .phone()
  .field('start_time')
  .required()
  .time()
  .field('end_time')
  .required()
  .time()
  .field('date')
  .required()
  .date()
  .futureDate()

export const businessSchema = new ValidationSchema()
  .field('name')
  .required()
  .minLength(2)
  .maxLength(100)
  .field('category')
  .required()
  .field('email')
  .required()
  .email()
  .field('phone')
  .required()
  .phone()
  .field('address')
  .required()
  .minLength(5)
  .maxLength(200)
  .field('city')
  .required()
  .minLength(2)
  .maxLength(50)
  .field('country')
  .required()
  .minLength(2)
  .maxLength(50)
  .field('website')
  .url()

export const clientSchema = new ValidationSchema()
  .field('name')
  .required()
  .minLength(2)
  .maxLength(100)
  .field('email')
  .email()
  .field('phone')
  .phone()
  .field('company')
  .maxLength(100)
  .field('address')
  .maxLength(200)

export const serviceSchema = new ValidationSchema()
  .field('name')
  .required()
  .minLength(2)
  .maxLength(100)
  .field('description')
  .maxLength(500)
  .field('duration')
  .required()
  .min(5)
  .max(480) // 5 minutes to 8 hours
  .field('price')
  .required()
  .min(0)
  .field('category')
  .required()
  .minLength(2)
  .maxLength(50)

export const userProfileSchema = new ValidationSchema()
  .field('name')
  .required()
  .minLength(2)
  .maxLength(100)
  .field('email')
  .required()
  .email()
  .field('phone')
  .phone()
  .field('timezone')
  .required()

export const passwordChangeSchema = new ValidationSchema()
  .field('currentPassword')
  .required()
  .field('newPassword')
  .required()
  .password()
  .field('confirmPassword')
  .required()
  .field('confirmPassword')
  .custom(value => {
    // This needs to be implemented with access to newPassword
    return { isValid: true }
  })

// Utility function to validate a single field
export const validateField = (
  value: unknown,
  validatorNames: string[],
  options?: { min?: number; max?: number }
): ValidationResult => {
  for (const validatorName of validatorNames) {
    let validator: (value: unknown) => ValidationResult

    switch (validatorName) {
      case 'required':
        validator = validators.required
        break
      case 'email':
        validator = validators.email
        break
      case 'phone':
        validator = validators.phone
        break
      case 'time':
        validator = validators.time
        break
      case 'url':
        validator = validators.url
        break
      case 'password':
        validator = validators.password
        break
      case 'date':
        validator = validators.date
        break
      case 'futureDate':
        validator = validators.futureDate
        break
      case 'minLength':
        validator = validators.minLength(options?.min || 1)
        break
      case 'maxLength':
        validator = validators.maxLength(options?.max || 255)
        break
      case 'min':
        validator = validators.min(options?.min || 0)
        break
      case 'max':
        validator = validators.max(options?.max || Number.MAX_SAFE_INTEGER)
        break
      default:
        continue
    }

    const result = validator(value)
    if (!result.isValid) {
      return result
    }
  }

  return { isValid: true }
}

// Real-time validation hook helper
export const createFieldValidator = (schema: ValidationSchema) => {
  return (fieldName: string, value: unknown) => {
    const data: Record<string, unknown> = { [fieldName]: value }
    const result = schema.validate(data)
    return {
      isValid: !result.errors[fieldName],
      error: result.errors[fieldName],
    }
  }
}
