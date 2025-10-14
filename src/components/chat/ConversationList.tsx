import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Pin, Archive, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ConversationPreview } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  conversations: ConversationPreview[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  totalUnreadCount?: number;
  loading?: boolean;
}

/**
 * ConversationList Component
 * 
 * Lista lateral de conversaciones con:
 * - Búsqueda de conversaciones
 * - Preview del último mensaje
 * - Badge de mensajes no leídos
 * - Indicador de conversaciones fijadas
 * - Ordenamiento: pinned > last_message_at
 * - Scroll infinito (futuro)
 */
export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  totalUnreadCount = 0,
  loading = false
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar conversaciones por búsqueda
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const name = conv.name?.toLowerCase() || '';
    const displayName = conv.display_name?.toLowerCase() || '';
    const otherUserName = conv.other_user?.full_name?.toLowerCase() || '';
    const otherUserEmail = conv.other_user?.email?.toLowerCase() || '';
    const preview = conv.last_message_preview?.toLowerCase() || '';

    return (
      name.includes(query) ||
      displayName.includes(query) ||
      otherUserName.includes(query) ||
      otherUserEmail.includes(query) ||
      preview.includes(query)
    );
  });

  // Ordenar: pinned primero, luego por último mensaje
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    // Pinned primero (si el usuario tiene la conversación pinned)
    const aPinned = a.members?.find(m => m.user_id)?.user_id ? false : false; // TODO: Agregar is_pinned
    const bPinned = b.members?.find(m => m.user_id)?.user_id ? false : false; // TODO: Agregar is_pinned
    
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    // Luego por último mensaje
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <div className="flex flex-col h-full border-r bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Mensajes</h2>
          {totalUnreadCount > 0 && (
            <Badge variant="default" className="rounded-full">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Lista de conversaciones */}
      <ScrollArea className="flex-1">
        {loading && sortedConversations.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Cargando conversaciones...
          </div>
        )}
        
        {!loading && sortedConversations.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No se encontraron conversaciones' : 'No hay conversaciones'}
          </div>
        )}
        
        {sortedConversations.length > 0 && (
          <div className="divide-y">
            {sortedConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

/**
 * ConversationItem Component
 * 
 * Item individual de conversación
 */
interface ConversationItemProps {
  conversation: ConversationPreview;
  isActive: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  // Obtener título de la conversación
  const title =
    conversation.type === 'direct'
      ? conversation.display_name || // Nombre personalizado o nombre del otro usuario
        conversation.other_user?.full_name ||
        conversation.other_user?.email ||
        'Usuario'
      : conversation.name || 'Grupo';

  // Obtener iniciales para avatar
  const initials = title
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Formatear timestamp del último mensaje
  const lastMessageDate = conversation.last_message_at 
    ? new Date(conversation.last_message_at) 
    : new Date();
  const now = new Date();
  const isToday =
    lastMessageDate.getDate() === now.getDate() &&
    lastMessageDate.getMonth() === now.getMonth() &&
    lastMessageDate.getFullYear() === now.getFullYear();

  const timestamp = conversation.last_message_at
    ? isToday
      ? format(lastMessageDate, 'HH:mm', { locale: es })
      : format(lastMessageDate, 'd MMM', { locale: es })
    : '';

  const hasUnread = (conversation.unread_count || 0) > 0;
  
  // Verificar si está pinned (desde members del usuario actual)
  // TODO: Agregar campo is_pinned a conversation_members
  const isPinned = false; // conversation.members?.some(m => m.is_pinned) || false;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left',
        isActive && 'bg-muted'
      )}
    >
      {/* Avatar */}
      <Avatar className="h-12 w-12 flex-shrink-0">
        <AvatarImage
          src={conversation.other_user?.avatar_url || undefined}
          alt={title}
        />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {/* Título y timestamp */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {/* TODO: Implementar is_pinned desde conversation_members */}
            {false && (
              <Pin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            )}
            {conversation.is_archived && (
              <Archive className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            )}
            <h3
              className={cn(
                'font-medium truncate',
                hasUnread && 'font-semibold'
              )}
            >
              {title}
            </h3>
          </div>
          {timestamp && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {timestamp}
            </span>
          )}
        </div>

        {/* Preview y unread badge */}
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'text-sm text-muted-foreground truncate',
              hasUnread && 'font-medium text-foreground'
            )}
          >
            {conversation.last_message_preview || 'Sin mensajes'}
          </p>
          {hasUnread && (
            <Badge variant="default" className="rounded-full h-5 min-w-[20px] px-1.5 text-xs">
              {conversation.unread_count! > 99 ? '99+' : conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
