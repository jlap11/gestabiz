// Tipos centralizados para configuraciones de settings

export interface SettingItemProps {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export interface TimeSelectorProps {
  value?: string;
  defaultValue?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export interface ThemeSelectorProps {
  className?: string;
}

export interface LanguageSelectorProps {
  user: any; // TODO: Tipificar mejor cuando se tenga el tipo User definido
  onUserUpdate: (updates: any) => void;
}

export interface BusinessSettings {
  onlineBookings: boolean;
  autoConfirmation: boolean;
  automaticReminders: boolean;
  publicPricing: boolean;
  defaultStartTime: string;
  defaultEndTime: string;
}

export interface ClientPreferences {
  appointmentReminders: boolean;
  emailConfirmation: boolean;
  promotionNotifications: boolean;
  savePaymentMethods: boolean;
  preferredAnticipationTime: string;
}

export interface EmployeeSettings {
  // TODO: Definir configuraciones específicas para empleados
  workingHours: {
    start: string;
    end: string;
  };
  availableServices: string[];
  notificationPreferences: {
    newAppointments: boolean;
    cancellations: boolean;
    reminders: boolean;
  };
}

export interface AdminSettingsProps {
  businessSettings: BusinessSettings;
  onBusinessSettingsChange: (settings: Partial<BusinessSettings>) => void;
}

export interface ClientSettingsProps {
  preferences: ClientPreferences;
  onPreferencesChange: (preferences: Partial<ClientPreferences>) => void;
  serviceHistory?: any[]; // TODO: Tipificar mejor cuando se tenga el tipo Service definido
}

export interface EmployeeSettingsProps {
  settings: EmployeeSettings;
  onSettingsChange: (settings: Partial<EmployeeSettings>) => void;
}

export type UserRole = 'admin' | 'employee' | 'client';

export interface UnifiedSettingsProps {
  user: any; // TODO: Tipificar mejor cuando se tenga el tipo User definido
  userRole: UserRole;
  onUserUpdate: (updates: any) => void;
}

// Tipos para las configuraciones de notificaciones
export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  appointmentReminders: boolean;
  promotionalEmails: boolean;
  systemUpdates: boolean;
}

// Tipos para configuraciones de perfil
export interface ProfileSettings {
  displayName: string;
  email: string;
  phone?: string;
  avatar?: string;
  timezone: string;
  language: 'es' | 'en';
}

// Tipo unificado para todas las configuraciones
export interface AllSettings {
  profile: ProfileSettings;
  notifications: NotificationSettings;
  business?: BusinessSettings; // Solo para admin
  client?: ClientPreferences; // Solo para client
  employee?: EmployeeSettings; // Solo para employee
}