import { AnimatePresence, motion } from 'framer-motion';
import { getFreeMinutes, WALK_TIME_ESTIMATES } from '../utils/getFreeTime';

interface TimeConfidenceBarProps {
  minutesToBoarding: number | null;
  terminalCode: string | null;
  gateNumber: string | null;
}

function formatFreeTime(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m free` : `${h}h free`;
  }
  return `${minutes}m free`;
}

function getConfidenceColor(freeMinutes: number): string {
  if (freeMinutes > 60) return 'text-emerald-400';
  if (freeMinutes >= 30) return 'text-amber-400';
  return 'text-red-400';
}

export default function TimeConfidenceBar({
  minutesToBoarding,
  terminalCode,
  gateNumber,
}: TimeConfidenceBarProps) {
  const freeMinutes = getFreeMinutes(minutesToBoarding, terminalCode);
  const walkTime = terminalCode
    ? WALK_TIME_ESTIMATES[terminalCode] ?? 10
    : null;

  const show = freeMinutes !== null && walkTime !== null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mx-4 mb-3"
        >
          <div className="rounded-full bg-white/10 backdrop-blur-xl px-4 py-2 flex items-center justify-center">
            <span
              className={`text-sm font-medium truncate ${getConfidenceColor(freeMinutes!)}`}
            >
              {formatFreeTime(freeMinutes!)}
              {gateNumber && walkTime
                ? ` · Gate ${gateNumber} is a ${walkTime} min walk`
                : ''}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
