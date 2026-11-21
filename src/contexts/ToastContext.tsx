import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { Toaster, toast } from 'sonner';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'default';

interface ShowToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (input: ShowToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback(
    ({ title, description, variant = 'info', durationMs = 3500 }: ShowToastInput) => {
      const options = {
        description,
        duration: durationMs,
      };

      switch (variant) {
        case 'success': {
          toast.success(title, options);
          break;
        }
        case 'error': {
          toast.error(title, options);
          break;
        }
        case 'warning': {
          toast.warning(title, options);
          break;
        }
        case 'default': {
          toast(title, options);
          break;
        }
        case 'info':
        default: {
          toast.info(title, options);
        }
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      showToast,
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster position="top-right" />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
}
