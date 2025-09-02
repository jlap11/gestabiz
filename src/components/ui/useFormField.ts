import { createContext, useContext } from "react"
import { useFormContext, useFormState } from "react-hook-form"

const FormFieldContext = createContext<{ name: string } | null>(null)
const FormItemContext = createContext<{ id: string } | null>(null)

export const InternalFormContexts = {
  FormFieldContext,
  FormItemContext,
}

export const useFormField = () => {
  const fieldContext = useContext(FormFieldContext)
  const itemContext = useContext(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext!.name })
  const fieldState = getFieldState(fieldContext!.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext as { id: string }

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}
