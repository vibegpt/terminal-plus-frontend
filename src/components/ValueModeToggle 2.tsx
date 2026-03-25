import React from 'react';
import { useValueMode } from '@/hooks/useValueMode';

export const ValueModeToggle: React.FC = () => {
  const { valueMode, toggleValueMode } = useValueMode();

  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={valueMode}
          onChange={toggleValueMode}
          className="form-checkbox h-4 w-4 text-green-500"
        />
        <span className="ml-2 text-slate-700 dark:text-slate-300">
          💸 Value Mode
        </span>
      </label>
      <span className="text-xs text-slate-500 ml-1">Smart filters to save money</span>
    </div>
  );
}; 