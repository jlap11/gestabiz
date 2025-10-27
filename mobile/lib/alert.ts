import { Alert } from 'react-native'

type Options = {
  title?: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

export const mobileAlert = (message: string, opts: Options = {}) => {
  Alert.alert(opts.title ?? 'Información', message, [
    { text: opts.confirmText ?? 'Aceptar', onPress: opts.onConfirm },
  ])
}

export const mobileConfirm = (message: string, onConfirm: () => void, opts: Options = {}) => {
  Alert.alert(opts.title ?? 'Confirmar', message, [
    { text: opts.cancelText ?? 'Cancelar', style: 'cancel', onPress: opts.onCancel },
    { text: opts.confirmText ?? 'Confirmar', onPress: onConfirm },
  ])
}

