import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface SelectEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  candidateName: string
  vacancyTitle: string
  otherCandidatesCount: number
  isLoading?: boolean
}

export function SelectEmployeeModal({
  isOpen,
  onClose,
  onConfirm,
  candidateName,
  vacancyTitle,
  otherCandidatesCount,
  isLoading = false,
}: Readonly<SelectEmployeeModalProps>) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">¿Seleccionar como empleado?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-4">
            <p className="text-base">
              Estás a punto de seleccionar a{' '}
              <strong className="text-foreground">{candidateName}</strong> como empleado para la
              vacante <strong className="text-foreground">{vacancyTitle}</strong>
            </p>

            <Alert className="border-orange-600 bg-orange-50 dark:bg-orange-800 dark:border-orange-700">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-200" />
              <AlertTitle className="text-orange-900 dark:text-orange-100 font-semibold">
                Efectos de esta acción:
              </AlertTitle>
              <AlertDescription className="text-orange-900 dark:text-orange-100 mt-2">
                <ul className="list-disc pl-5 space-y-2">
                  <li>El candidato será agregado como empleado del negocio</li>
                  <li>Deberá completar su perfil de empleado (horarios, servicios, etc.)</li>
                  <li>La vacante se cerrará automáticamente si se llenan todas las posiciones</li>
                  {otherCandidatesCount > 0 && (
                    <li>
                      Los demás candidatos en proceso ({otherCandidatesCount}) serán notificados del
                      rechazo
                    </li>
                  )}
                  <li className="font-semibold">Esta acción NO se puede deshacer</li>
                </ul>
              </AlertDescription>
            </Alert>

            {otherCandidatesCount > 0 && (
              <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-900/20">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-900 dark:text-blue-100 font-semibold">
                  Notificaciones automáticas
                </AlertTitle>
                <AlertDescription className="text-blue-900 dark:text-blue-100 mt-2">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>{candidateName}</strong> recibirá un email de felicitación
                    </li>
                    <li>
                      {otherCandidatesCount === 1
                        ? 'El otro candidato'
                        : `Los otros ${otherCandidatesCount} candidatos`}{' '}
                      recibirá{otherCandidatesCount === 1 ? '' : 'n'} un email informándoles la
                      decisión
                    </li>
                    <li>Todos recibirán notificaciones in-app</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <p className="text-sm text-muted-foreground">¿Estás seguro de que deseas continuar?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={e => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Selección
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
