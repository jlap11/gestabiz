import React, { createContext, useContext, useState, ReactNode } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertConfig {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

interface AlertContextType {
  showAlert: (config: AlertConfig) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useCustomAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useCustomAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showAlert = (config: AlertConfig) => {
    setAlertConfig(config);
    setIsVisible(true);
  };

  const hideAlert = () => {
    setIsVisible(false);
    setTimeout(() => setAlertConfig(null), 300); // Wait for animation
  };

  const handleConfirm = () => {
    alertConfig?.onConfirm?.();
    hideAlert();
  };

  const handleCancel = () => {
    alertConfig?.onCancel?.();
    hideAlert();
  };

  const getIcon = (type: AlertConfig['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getHeaderColor = (type: AlertConfig['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      
      {/* Alert Modal */}
      {isVisible && alertConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className={cn(
              "absolute inset-0 bg-black/50 transition-opacity duration-300",
              isVisible ? "opacity-100" : "opacity-0"
            )}
            onClick={hideAlert}
          />
          
          {/* Alert Dialog */}
          <div 
            className={cn(
              "relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300",
              isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            )}
          >
            {/* Header */}
            <div className={cn(
              "flex items-center gap-3 p-4 border-b rounded-t-lg",
              getHeaderColor(alertConfig.type)
            )}>
              {getIcon(alertConfig.type)}
              <h3 className="text-lg font-semibold text-gray-900">
                {alertConfig.title || 'Alerta'}
              </h3>
              <button
                onClick={hideAlert}
                className="ml-auto p-1 hover:bg-white/50 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4">
              <p className="text-gray-700 leading-relaxed">
                {alertConfig.message}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
              {alertConfig.showCancel && (
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
                >
                  {alertConfig.cancelText || 'Cancelar'}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={cn(
                  "flex-1 px-4 py-2 text-white rounded-md transition-colors font-medium",
                  alertConfig.type === 'error' 
                    ? "bg-red-600 hover:bg-red-700" 
                    : alertConfig.type === 'warning'
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : alertConfig.type === 'success'
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {alertConfig.confirmText || 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

// Helper function to replace window.alert
export const customAlert = (message: string, title?: string, type?: AlertConfig['type']) => {
  // This will be used as a fallback when the context is not available
  console.warn('CustomAlert context not available, falling back to native alert');
  window.alert(message);
};