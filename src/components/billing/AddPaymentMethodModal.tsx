/**
 * AddPaymentMethodModal Component
 * 
 * Modal para agregar un nuevo método de pago con Stripe Elements
 */

import { useState, useEffect } from 'react'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2, Lock } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

interface AddPaymentMethodModalProps {
  businessId: string
  onClose: () => void
  onSuccess: () => void
}

// Componente interno con acceso a Stripe Elements
function PaymentForm({ 
  businessId, 
  onClose, 
  onSuccess 
}: Readonly<AddPaymentMethodModalProps>) {
  const { t } = useLanguage()
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Confirmar Setup Intent con Payment Element
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Error al procesar la tarjeta')
        return
      }

      const { error: confirmError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/billing?payment_method=success`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        setError(confirmError.message || 'Error al confirmar el método de pago')
        return
      }

      // Éxito
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Payment Element de Stripe */}
      <div className="border rounded-lg p-4 bg-white">
        <PaymentElement 
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                address: {
                  country: 'CO',
                },
              },
            },
          }}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Información de seguridad */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <div className="flex items-start gap-2">
          <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 mb-1">{t('billing.securePayment')}</p>
            <p className="text-blue-800">
              Tus datos de pago son procesados de forma segura por Stripe.
              No almacenamos información de tarjetas en nuestros servidores.
            </p>
          </div>
        </div>
      </div>

      {/* Botones */}
      <DialogFooter>
        <Button 
          type="button"
          variant="outline" 
          onClick={onClose} 
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          disabled={!stripe || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            'Agregar Tarjeta'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AddPaymentMethodModal({
  businessId,
  onClose,
  onSuccess,
}: Readonly<AddPaymentMethodModalProps>) {
  const { t } = useLanguage()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const createSetupIntent = async () => {
      try {
        // Validar que Stripe esté configurado
        if (!stripePromise) {
          throw new Error('Stripe no está configurado. Este modal solo se puede usar con Stripe.')
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          throw new Error('No autenticado')
        }

        // Llamar Edge Function para crear Setup Intent
        const response = await fetch(
          `${supabaseUrl}/functions/v1/create-setup-intent`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ businessId }),
          }
        )

        if (!response.ok) {
          throw new Error('Error al crear Setup Intent')
        }

        const data = await response.json()
        setClientSecret(data.clientSecret)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar formulario')
      } finally {
        setIsLoading(false)
      }
    }

    createSetupIntent()
  }, [businessId])

  const elementsOptions: StripeElementsOptions = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0F172A',
        colorBackground: '#ffffff',
        colorText: '#1e293b',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
    locale: 'es',
  } : {} as StripeElementsOptions

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('billing.addPaymentMethod')}</DialogTitle>
          <DialogDescription>
            Agrega una tarjeta de crédito o débito de forma segura
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="mt-4 w-full"
            >
              Cerrar
            </Button>
          </div>
        )}

        {!isLoading && !error && clientSecret && (
          <Elements stripe={stripePromise} options={elementsOptions}>
            <PaymentForm
              businessId={businessId}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  )
}
