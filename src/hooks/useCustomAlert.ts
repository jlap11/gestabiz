import { useCustomAlert as useCustomAlertContext } from '@/components/ui/custom-alert';

interface AlertOptions {
  title?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export const useCustomAlert = () => {
  const { showAlert, hideAlert } = useCustomAlertContext();

  // Simple alert (replaces window.alert)
  const alert = (message: string, options?: Omit<AlertOptions, 'showCancel'>) => {
    showAlert({
      message,
      title: options?.title,
      type: options?.type || 'info',
      confirmText: options?.confirmText || 'Aceptar',
      onConfirm: options?.onConfirm,
      showCancel: false,
    });
  };

  // Confirm dialog (replaces window.confirm)
  const confirm = (
    message: string, 
    onConfirm: () => void, 
    options?: AlertOptions
  ) => {
    showAlert({
      message,
      title: options?.title || 'Confirmar',
      type: options?.type || 'warning',
      confirmText: options?.confirmText || 'Confirmar',
      cancelText: options?.cancelText || 'Cancelar',
      onConfirm,
      onCancel: options?.onCancel,
      showCancel: true,
    });
  };

  // Success alert
  const success = (message: string, options?: Omit<AlertOptions, 'type' | 'showCancel'>) => {
    showAlert({
      message,
      title: options?.title || 'Éxito',
      type: 'success',
      confirmText: options?.confirmText || 'Aceptar',
      onConfirm: options?.onConfirm,
      showCancel: false,
    });
  };

  // Error alert
  const error = (message: string, options?: Omit<AlertOptions, 'type' | 'showCancel'>) => {
    showAlert({
      message,
      title: options?.title || 'Error',
      type: 'error',
      confirmText: options?.confirmText || 'Aceptar',
      onConfirm: options?.onConfirm,
      showCancel: false,
    });
  };

  // Warning alert
  const warning = (message: string, options?: Omit<AlertOptions, 'type' | 'showCancel'>) => {
    showAlert({
      message,
      title: options?.title || 'Advertencia',
      type: 'warning',
      confirmText: options?.confirmText || 'Aceptar',
      onConfirm: options?.onConfirm,
      showCancel: false,
    });
  };

  // Info alert
  const info = (message: string, options?: Omit<AlertOptions, 'type' | 'showCancel'>) => {
    showAlert({
      message,
      title: options?.title || 'Información',
      type: 'info',
      confirmText: options?.confirmText || 'Aceptar',
      onConfirm: options?.onConfirm,
      showCancel: false,
    });
  };

  return {
    alert,
    confirm,
    success,
    error,
    warning,
    info,
    hideAlert,
  };
};