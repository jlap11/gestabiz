import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Share2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface WizardData {
  service: { name: string } | null;
  date: Date | null;
  startTime: string | null;
  location: { name: string } | null;
}

interface SuccessStepProps {
  readonly appointmentData: WizardData;
  readonly onClose: () => void;
}

export function SuccessStep({ appointmentData, onClose }: SuccessStepProps) {
  const [status, setStatus] = useState<'loading' | 'success'>('loading');

  useEffect(() => {
    // Simular proceso de guardado
    const timer = setTimeout(() => {
      setStatus('success');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const { service, date, startTime, location } = appointmentData;

  const handleAddToCalendar = () => {
    // Implementar integración con Google Calendar
    alert('Add to Google Calendar feature coming soon!');
  };

  const handleShare = () => {
    // Implementar funcionalidad de compartir
    if (navigator.share) {
      navigator.share({
        title: 'Appointment Confirmation',
        text: `Appointment for ${service?.name} on ${date ? format(date, 'MMMM d, yyyy') : ''} at ${startTime}`,
      }).catch(() => {
        // Silently fail if user cancels share
      });
    } else {
      alert('Share feature not supported on this browser');
    }
  };

  return (
    <div className="p-8">
      {/* Close button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          disabled={status === 'loading'}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Animation Area */}
      <div className="flex flex-col items-center justify-center py-8">
        {status === 'loading' ? (
          <div
            className={cn(
              "w-20 h-20 rounded-full border-4 border-[#8b5cf6]/30",
              "border-t-[#8b5cf6] animate-spin mb-6"
            )}
          />
        ) : (
          <div className="animate-in zoom-in duration-500">
            <CheckCircle className="w-24 h-24 text-[#10b981] mb-6" />
          </div>
        )}

        {/* Title */}
        <h2 className="text-3xl font-bold text-white mb-4 text-center">
          {status === 'loading' ? 'Processing...' : 'Appointment Confirmed!'}
        </h2>

        {/* Description */}
        {status === 'success' && (
          <div className="text-center mb-8 animate-in fade-in duration-500 delay-300">
            <p className="text-[#94a3b8] text-base max-w-md">
              Your appointment {service?.name && (
                <>
                  for <span className="font-semibold text-white">{service.name}</span>
                </>
              )} {location?.name && (
                <>
                  at <span className="font-semibold text-white">{location.name}</span>
                </>
              )} {date && startTime && (
                <>
                  for{' '}
                  <span className="font-semibold text-white">
                    {format(date, 'EEEE, MMMM d')} at {startTime}
                  </span>
                </>
              )} has been successfully scheduled.
            </p>
          </div>
        )}

        {/* Quick Actions */}
        {status === 'success' && (
          <div className="w-full max-w-sm space-y-3 animate-in slide-in-from-bottom duration-500 delay-500">
            <Button
              onClick={handleAddToCalendar}
              variant="outline"
              className="w-full bg-[#1e293b] border-white/10 text-white hover:bg-white/5 
                       hover:border-[#8b5cf6] transition-all"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Add to Google Calendar
            </Button>

            <Button
              onClick={handleShare}
              className="w-full bg-[#ff8c00] hover:bg-[#e67e00] text-white font-semibold
                       shadow-lg shadow-orange-500/30 transition-all"
            >
              <Share2 className="mr-2 h-5 w-5" />
              Share Appointment
            </Button>
          </div>
        )}
      </div>

      {/* Footer info */}
      {status === 'success' && (
        <div className="text-center mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-[#64748b]">
            📧 Confirmation email sent • 📱 You'll receive a reminder 1 hour before
          </p>
        </div>
      )}
    </div>
  );
}
