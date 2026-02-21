import { useState } from 'react';
import type { ToastType } from '@/types/common.types';

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