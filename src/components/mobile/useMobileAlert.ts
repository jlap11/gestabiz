import { Alert } from 'react-native'

type AlertType = 'info' | 'success' | 'warning' | 'error'

interface Options {
  title?: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

const titleByType: Record<AlertType, string> = {
  info: 'Información',
  success: 'Éxito',
  warning: 'Advertencia',
  error: 'Error',
}

export function useMobileAlert() {
  const show = (message: string, type: AlertType = 'info', opts: Options = {}) => {
    Alert.alert(opts.title ?? titleByType[type], message, [
      { text: opts.confirmText ?? 'Aceptar', onPress: opts.onConfirm },
    ])
  }

  const confirm = (message: string, onConfirm: () => void, opts: Options = {}) => {
    Alert.alert(opts.title ?? titleByType.warning, message, [
      { text: opts.cancelText ?? 'Cancelar', style: 'cancel', onPress: opts.onCancel },
      { text: opts.confirmText ?? 'Confirmar', onPress: onConfirm },
    ])
  }

  return {
    info: (m: string, o?: Options) => show(m, 'info', o),
    success: (m: string, o?: Options) => show(m, 'success', o),
    warning: (m: string, o?: Options) => show(m, 'warning', o),
    error: (m: string, o?: Options) => show(m, 'error', o),
    confirm,
  }
}

