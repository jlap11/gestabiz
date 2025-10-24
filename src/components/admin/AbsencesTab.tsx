/**
 * Component: AbsencesTab
 * 
 * Tab de ausencias en AdminDashboard para gestionar solicitudes de ausencias.
 * Muestra todas las solicitudes pendientes y aprobadas/rechazadas.
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AbsenceApprovalCard } from '@/components/absences/AbsenceApprovalCard';
import { useAbsenceApprovals } from '@/hooks/useAbsenceApprovals';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

interface AbsencesTabProps {
  businessId: string;
}

export function AbsencesTab({ businessId }: Readonly<AbsencesTabProps>) {
  const { t } = useLanguage();
  const { pendingAbsences, approvedAbsences, rejectedAbsences, loading, approveAbsence, rejectAbsence } = useAbsenceApprovals(businessId);

  const historyAbsences = [...approvedAbsences, ...rejectedAbsences];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t('absences.management.title')}</h2>
        <p className="text-muted-foreground mt-1">
          {t('absences.management.subtitle')}
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            {t('absences.management.tabs.pending', { count: String(pendingAbsences.length) })}
          </TabsTrigger>
          <TabsTrigger value="history">
            {t('absences.management.tabs.history', { count: String(historyAbsences.length) })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pendingAbsences.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">{t('absences.management.empty.noPending')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingAbsences.map((absence) => (
                <AbsenceApprovalCard
                  key={absence.id}
                  absence={absence}
                  onApprove={async (id, notes) => {
                    await approveAbsence(id, notes);
                  }}
                  onReject={async (id, notes) => {
                    await rejectAbsence(id, notes);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          {historyAbsences.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">{t('absences.management.empty.noHistory')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {historyAbsences.map((absence) => (
                <AbsenceApprovalCard
                  key={absence.id}
                  absence={absence}
                  onApprove={async () => {
                    // No action needed - read-only
                  }}
                  onReject={async () => {
                    // No action needed - read-only
                  }}
                  loading={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
