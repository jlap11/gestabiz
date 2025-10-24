import { useCallback, useMemo, useState } from 'react'
import { FormValidationResult, ValidationSchema } from '@/lib/validation'

interface UseFormOptions<T> {
  initialValues: T
  validationSchema?: ValidationSchema
  onSubmit?: (values: T) => Promise<void> | void
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

interface UseFormReturn<T> {
  values: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isValid: boolean
  isSubmitting: boolean
  isDirty: boolean
  setValue: <K extends keyof T>(name: K, value: T[K]) => void
  setValues: (values: Partial<T>) => void
  setError: (name: keyof T, error: string) => void
  setErrors: (errors: Record<string, string>) => void
  clearError: (name: keyof T) => void
  clearErrors: () => void
  setTouched: (name: keyof T, touched?: boolean) => void
  setFieldTouched: (name: keyof T) => void
  validateField: (name: keyof T) => boolean
  validateForm: () => boolean
  handleChange: <K extends keyof T>(name: K) => (value: T[K]) => void
  handleBlur: (name: keyof T) => () => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  reset: () => void
  resetField: (name: keyof T) => void
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validationSchema,
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues)
  const [errors, setErrorsState] = useState<Record<string, string>>({})
  const [touched, setTouchedState] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Derived state
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0
  }, [errors])

  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues)
  }, [values, initialValues])

  // Validation helpers
  const validateSingleField = useCallback(
    (name: keyof T): boolean => {
      if (!validationSchema) return true

      const fieldValue = values[name]
      const fieldData = { [name]: fieldValue }
      const result: FormValidationResult = validationSchema.validate(fieldData)

      if (result.errors[name as string]) {
        setErrorsState(prev => ({
          ...prev,
          [name]: result.errors[name as string],
        }))
        return false
      } else {
        setErrorsState(prev => {
          const newErrors = { ...prev }
          delete newErrors[name as string]
          return newErrors
        })
        return true
      }
    },
    [values, validationSchema]
  )

  const validateAllFields = useCallback((): boolean => {
    if (!validationSchema) return true

    const result: FormValidationResult = validationSchema.validate(values)
    setErrorsState(result.errors)
    return result.isValid
  }, [values, validationSchema])

  // Field setters
  const setValue = useCallback(
    <K extends keyof T>(name: K, value: T[K]) => {
      setValuesState(prev => ({
        ...prev,
        [name]: value,
      }))

      if (validateOnChange) {
        // Validate after setting the value
        setTimeout(() => validateSingleField(name), 0)
      }
    },
    [validateOnChange, validateSingleField]
  )

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({
      ...prev,
      ...newValues,
    }))
  }, [])

  const setError = useCallback((name: keyof T, error: string) => {
    setErrorsState(prev => ({
      ...prev,
      [name]: error,
    }))
  }, [])

  const setErrors = useCallback((newErrors: Record<string, string>) => {
    setErrorsState(newErrors)
  }, [])

  const clearError = useCallback((name: keyof T) => {
    setErrorsState(prev => {
      const newErrors = { ...prev }
      delete newErrors[name as string]
      return newErrors
    })
  }, [])

  const clearErrors = useCallback(() => {
    setErrorsState({})
  }, [])

  const setTouched = useCallback((name: keyof T, isTouched = true) => {
    setTouchedState(prev => ({
      ...prev,
      [name]: isTouched,
    }))
  }, [])

  const setFieldTouched = useCallback(
    (name: keyof T) => {
      setTouched(name, true)
      if (validateOnBlur) {
        validateSingleField(name)
      }
    },
    [setTouched, validateOnBlur, validateSingleField]
  )

  // Event handlers
  const handleChange = useCallback(
    <K extends keyof T>(name: K) =>
      (value: T[K]) => {
        setValue(name, value)
      },
    [setValue]
  )

  const handleBlur = useCallback(
    (name: keyof T) => () => {
      setFieldTouched(name)
    },
    [setFieldTouched]
  )

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()

      if (isSubmitting) return

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => {
          acc[key] = true
          return acc
        },
        {} as Record<string, boolean>
      )
      setTouchedState(allTouched)

      // Validate all fields
      const isFormValid = validateAllFields()

      if (!isFormValid || !onSubmit) return

      try {
        setIsSubmitting(true)
        await onSubmit(values)
      } catch (error) {
        // Handle submission error
        if (error instanceof Error) {
          setError('submit' as keyof T, error.message)
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, isSubmitting, validateAllFields, onSubmit, setError]
  )

  // Reset functions
  const reset = useCallback(() => {
    setValuesState(initialValues)
    setErrorsState({})
    setTouchedState({})
    setIsSubmitting(false)
  }, [initialValues])

  const resetField = useCallback(
    (name: keyof T) => {
      setValue(name, initialValues[name])
      clearError(name)
      setTouched(name, false)
    },
    [initialValues, setValue, clearError, setTouched]
  )

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty,
    setValue,
    setValues,
    setError,
    setErrors,
    clearError,
    clearErrors,
    setTouched,
    setFieldTouched,
    validateField: validateSingleField,
    validateForm: validateAllFields,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    resetField,
  }
}

// Helper hook for field-level validation
export function useFieldValidation<T>(
  value: T,
  validators: string[],
  options?: Record<string, unknown>
) {
  const [error, setError] = useState<string | undefined>()
  const [touched, setTouched] = useState(false)

  const validate = useCallback(() => {
    // Implementation would use the validation utilities
    // This is a simplified version
    setError(undefined)
    return true
  }, [])

  const onBlur = useCallback(() => {
    setTouched(true)
    validate()
  }, [validate])

  const onChange = useCallback(
    (newValue: T) => {
      if (touched) {
        validate()
      }
    },
    [touched, validate]
  )

  return {
    error,
    touched,
    validate,
    onBlur,
    onChange,
    isValid: !error,
  }
}
