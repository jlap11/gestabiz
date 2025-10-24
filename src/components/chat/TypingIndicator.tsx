import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ChatTypingUser } from '@/hooks/useChat';

interface TypingIndicatorProps {
  typingUsers: ChatTypingUser[];
}

/**
 * TypingIndicator Component
 * 
 * Muestra un indicador animado cuando otros usuarios están escribiendo.
 * Maneja singular/plural y muestra hasta 3 nombres.
 */
export function TypingIndicator({ typingUsers }: Readonly<TypingIndicatorProps>) {
  const { t } = useLanguage()
  if (typingUsers.length === 0) {
    return null;
  }

  // Obtener nombres de usuarios
  const names = typingUsers
    .map(u => u.user?.full_name || u.user?.email?.split('@')[0] || 'Usuario')
    .filter(Boolean);

  // Formatear texto según cantidad
  let text = '';
  if (names.length === 1) {
    text = `${names[0]} está escribiendo`;
  } else if (names.length === 2) {
    text = `${names[0]} y ${names[1]} están escribiendo`;
  } else if (names.length === 3) {
    text = `${names[0]}, ${names[1]} y ${names[2]} están escribiendo`;
  } else {
    text = `${names[0]}, ${names[1]} y ${names.length - 2} más están escribiendo`;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-muted-foreground text-sm">
      <span>{text}</span>
      <TypingAnimation />
    </div>
  );
}

/**
 * TypingAnimation Component
 * 
 * Animación de 3 puntos que aparecen secuencialmente
 */
function TypingAnimation() {
  return (
    <div className="flex gap-1">
      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-typing-dot animation-delay-0" />
      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-typing-dot animation-delay-150" />
      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-typing-dot animation-delay-300" />
    </div>
  );
}

// Agregar estas clases CSS a index.css o globals.css:
/*
@keyframes typing-dot {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

.animate-typing-dot {
  animation: typing-dot 1.4s infinite ease-in-out;
}

.animation-delay-0 {
  animation-delay: 0ms;
}

.animation-delay-150 {
  animation-delay: 150ms;
}

.animation-delay-300 {
  animation-delay: 300ms;
}
*/
