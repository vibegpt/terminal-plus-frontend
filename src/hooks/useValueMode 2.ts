import { useEffect, useState } from 'react';

export function useValueMode() {
  const [valueMode, setValueMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('valueMode');
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem('valueMode', JSON.stringify(valueMode));
  }, [valueMode]);

  return {
    valueMode,
    toggleValueMode: () => setValueMode(prev => !prev),
    setValueMode
  };
} 