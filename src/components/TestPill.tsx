// src/components/TestPill.tsx
// A small "TEST" pill while this browser's telemetry switch is on (localStorage
// tp_test = '1', set by ?tp_test=1). Top-left corner, over the logo text and never
// a control; pointer-events none, so it can't take a tap (CC-24).

import { useEffect, useState } from 'react';
import { isTestBrowser } from '@/lib/telemetry';

export function TestPill() {
  const [on, setOn] = useState(isTestBrowser);

  // Another tab can flip the switch.
  useEffect(() => {
    const sync = () => setOn(isTestBrowser());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  if (!on) return null;
  return (
    <div
      data-tp-test-pill
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 'max(2px, env(safe-area-inset-top))',
        left: 'max(2px, env(safe-area-inset-left))',
        zIndex: 9999,
        padding: '1px 5px',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.45)',
        font: '600 10px/12px "DM Sans", system-ui, sans-serif',
        letterSpacing: '0.08em',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      TEST
    </div>
  );
}

export default TestPill;
