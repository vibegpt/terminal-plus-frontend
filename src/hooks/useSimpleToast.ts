import { useState } from 'react';

type ToastType = 'success' | 'error' | 'loading';

type Toast = {
  message: string;
  type: ToastType;
} | null;

export function useSimpleToast() {
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast(null);
  };

  return {
    toast,
    showToast,
    clearToast
  };
}