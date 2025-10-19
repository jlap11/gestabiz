/**
 * ChatWithAdminModal Component
 * 
 * Modal para seleccionar un administrador del negocio e iniciar una conversación de chat.
 * Muestra la lista de administradores con sus sedes y distancias (si están disponibles).
 * 
 * @author Gestabiz Team
 * @version 1.0.0
 * @date 2025-10-19
 */

import { useState } from 'react';
import { X, MapPin, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBusinessAdmins, BusinessAdmin } from '@/hooks/useBusinessAdmins';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ChatWithAdminModalProps {
  readonly businessId: string;
  readonly businessName: string;
  readonly userLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  readonly onClose: () => void;
  readonly onChatStarted: () => void;
}

export default function ChatWithAdminModal({
  businessId,
  businessName,
  userLocation,
  onClose,
  onChatStarted,
}: ChatWithAdminModalProps) {
  const { user } = useAuth();
  const { admins, loading, error } = useBusinessAdmins({ businessId, userLocation });
  const { createOrGetConversation } = useChat(user?.id || null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);

  const handleStartChat = async (admin: BusinessAdmin) => {
    try {
      setCreatingChat(true);
      setSelectedAdminId(admin.user_id);

      const conversationId = await createOrGetConversation({
        other_user_id: admin.user_id,
        business_id: businessId,
        initial_message: `Hola, me interesa conocer más sobre ${businessName}`,
      });

      if (conversationId) {
        toast.success(`Chat iniciado con ${admin.full_name}`);
        onChatStarted();
        onClose();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error starting chat:', err);
      toast.error('No se pudo iniciar el chat. Intenta nuevamente.');
    } finally {
      setCreatingChat(false);
      setSelectedAdminId(null);
    }
  };

  const formatDistance = (distanceKm?: number) => {
    if (distanceKm === undefined) return null;
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">Iniciar Chat</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Selecciona un administrador de {businessName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-destructive text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => globalThis.location.reload()}
                className="mt-4"
              >
                Reintentar
              </Button>
            </div>
          )}

          {!loading && !error && admins.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No hay administradores disponibles en este momento.
              </p>
            </div>
          )}

          {!loading && !error && admins.length > 0 && (
            <div className="space-y-3">
              {admins.map((admin, index) => {
                const isClosest = index === 0 && admin.distance_km !== undefined;
                const isLoading = creatingChat && selectedAdminId === admin.user_id;

                return (
                  <Card
                    key={`${admin.user_id}-${admin.location_id}`}
                    className="p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={admin.avatar_url || undefined} />
                        <AvatarFallback>
                          {admin.full_name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base truncate">
                            {admin.full_name}
                          </h3>
                          {isClosest && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                              Más cerca
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {admin.location_name}
                            {admin.distance_km !== undefined && (
                              <span className="ml-2 font-medium text-primary">
                                ({formatDistance(admin.distance_km)})
                              </span>
                            )}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {admin.location_address}, {admin.location_city}, {admin.location_state}
                        </p>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => handleStartChat(admin)}
                        disabled={creatingChat}
                        size="sm"
                        className="flex-shrink-0"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Iniciando...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Chatear
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        {!loading && !error && admins.length > 0 && (
          <div className="border-t border-border p-4 bg-muted/50">
            <p className="text-xs text-muted-foreground text-center">
              {userLocation
                ? 'Las distancias son aproximadas basadas en tu ubicación actual.'
                : 'Habilita la ubicación para ver distancias aproximadas.'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
