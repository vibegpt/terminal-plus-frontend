import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export const vibeOptions = [
  { value: 'Relax', label: 'Relax', emoji: '🧘' },
  { value: 'Explore', label: 'Explore', emoji: '🧭' },
  { value: 'Work', label: 'Work', emoji: '💼' },
  { value: 'Quick', label: 'Quick', emoji: '⚡' }
];

export function getVibeEmoji(vibe: 'Relax' | 'Explore' | 'Work' | 'Quick'): string {
  const option = vibeOptions.find(opt => opt.value === vibe);
  return option ? option.emoji : '';
}
