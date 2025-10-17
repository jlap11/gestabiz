import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useJobApplications, type JobApplication } from '@/hooks/useJobApplications';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface MyApplicationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  reviewing: {
    label: 'En revisión',
    icon: AlertCircle,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  accepted: {
    label: 'Aceptada',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  rejected: {
    label: 'Rechazada',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  withdrawn: {
    label: 'Retirada',
    icon: XCircle,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  },
};

export const MyApplicationsModal: React.FC<MyApplicationsModalProps> = ({
  open,
  onOpenChange,
  userId,
}) => {
  const { applications, loading } = useJobApplications({ userId });
  const [activeTab, setActiveTab] = useState<JobApplication['status'] | 'all'>('all');

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    withdrawn: applications.filter(a => a.status === 'withdrawn').length,
  };

  const handleDownloadCV = async (cvUrl: string | undefined) => {
    if (!cvUrl) return;
    
    try {
      const { data, error } = await supabase
        .storage
        .from('cvs')
        .download(cvUrl);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = cvUrl.split('/').pop() || 'cv.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      // Error handling
    }
  };

  const tabsData: Array<{ key: JobApplication['status'] | 'all'; label: string; count: number }> = [
    { key: 'all', label: 'Todas', count: statusCounts.all },
    { key: 'pending', label: 'Pendientes', count: statusCounts.pending },
    { key: 'reviewing', label: 'En revisión', count: statusCounts.reviewing },
    { key: 'accepted', label: 'Aceptadas', count: statusCounts.accepted },
    { key: 'rejected', label: 'Rechazadas', count: statusCounts.rejected },
    { key: 'withdrawn', label: 'Retiradas', count: statusCounts.withdrawn },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mis Aplicaciones</DialogTitle>
          <DialogDescription>
            Visualiza el estado de todas tus aplicaciones a vacantes
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setActiveTab(v as JobApplication['status'] | 'all')}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">
              Todas ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pendientes ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="reviewing">
              En revisión ({statusCounts.reviewing})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Aceptadas ({statusCounts.accepted})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rechazadas ({statusCounts.rejected})
            </TabsTrigger>
            <TabsTrigger value="withdrawn">
              Retiradas ({statusCounts.withdrawn})
            </TabsTrigger>
          </TabsList>

          {['all', 'pending', 'reviewing', 'accepted', 'rejected', 'withdrawn'].map((tabKey) => {
            const tabApplications = tabKey === 'all'
              ? applications
              : applications.filter(a => a.status === tabKey);

            const emptyMessage = tabKey === 'all' 
              ? 'No hay aplicaciones' 
              : 'No hay aplicaciones en este estado';

            return (
              <TabsContent key={tabKey} value={tabKey} className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Cargando aplicaciones...
                  </div>
                ) : null}
                {!loading && tabApplications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {emptyMessage}
                  </div>
                ) : null}
                {!loading && tabApplications.length > 0 ? (
                  tabApplications.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      onDownloadCV={handleDownloadCV}
                    />
                  ))
                ) : null}
              </TabsContent>
            );
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

interface ApplicationCardProps {
  application: JobApplication;
  onDownloadCV: (cvUrl: string | undefined) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onDownloadCV,
}) => {
  const statusConfig = STATUS_CONFIG[application.status];
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{application.vacancy?.title}</CardTitle>
            </div>
            <CardDescription className="text-sm">
              {application.vacancy?.business_id}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5`} />
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Detalles principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {application.vacancy?.salary_min && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Salario ofrecido</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(application.vacancy.salary_min, 'COP')} - {formatCurrency(application.vacancy.salary_max || 0, 'COP')}
                </p>
              </div>
            </div>
          )}

          {application.expected_salary && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Tu salario esperado</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(application.expected_salary, 'COP')}
                </p>
              </div>
            </div>
          )}

          {application.available_from && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Disponible desde</p>
                <p className="text-sm font-semibold">
                  {new Date(application.available_from).toLocaleDateString('es-CO')}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Aplicada</p>
              <p className="text-sm font-semibold">
                {new Date(application.created_at).toLocaleDateString('es-CO')}
              </p>
            </div>
          </div>
        </div>

        {/* Notas de disponibilidad */}
        {application.availability_notes && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Notas</p>
            <p className="text-sm">{application.availability_notes}</p>
          </div>
        )}

        {/* Carta de presentación */}
        {application.cover_letter && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Carta de presentación</p>
            <p className="text-sm line-clamp-2">{application.cover_letter}</p>
          </div>
        )}

        {/* Razón de rechazo */}
        {application.status === 'rejected' && application.rejection_reason && (
          <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md">
            <p className="text-xs font-semibold text-destructive mb-1">Razón del rechazo</p>
            <p className="text-sm text-destructive/90">{application.rejection_reason}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2 pt-2">
          {application.cv_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadCV(application.cv_url)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar CV
            </Button>
          )}
          
          {application.cover_letter && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Ver carta
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
