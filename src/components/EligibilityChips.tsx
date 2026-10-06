// src/components/EligibilityChips.tsx
// The two card labels the eligibility rules add (shared/ranking/policy.ts):
// a landside label ("Before immigration") and "Opens HH:MM" for a venue that
// filled the list as opening soon. Text comes from landsideCopy.ts via the row.

export function AccessChip({ label }: { label: string | null | undefined }) {
  if (!label) return null;
  return (
    <span
      data-testid="access-label"
      className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 leading-snug"
    >
      {label}
    </span>
  );
}

export function OpensChip({ label }: { label: string | null | undefined }) {
  if (!label) return null;
  return (
    <span
      data-testid="opens-label"
      className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 flex-shrink-0"
    >
      {label}
    </span>
  );
}

/** Shown in place of a hidden venue's content: why the app isn't suggesting it. */
export function LandsideNotice({ text, tone = 'reason' }: { text: string | null | undefined; tone?: 'reason' | 'label' }) {
  if (!text) return null;
  return (
    <div
      data-testid={tone === 'reason' ? 'landside-reason' : 'landside-label'}
      role="note"
      className={`rounded-xl px-3.5 py-3 text-[13px] leading-snug ${
        tone === 'reason'
          ? 'bg-amber-500/10 border border-amber-400/25 text-amber-200'
          : 'bg-white/[0.04] border border-white/10 text-white/70'
      }`}
    >
      {text}
    </div>
  );
}
