// src/components/LayoutDebug.tsx
// Preview-only layout readout for capture (CC-23). Shows only on a build with
// VITE_TP_DEBUG=1 (Vercel Preview) and only after ?tp_layout=1 is opened in the
// tab; the flag is kept in sessionStorage so SPA navigation doesn't drop it.
// Production builds compile ENABLED_BUILD to false and render nothing.

import React, { useEffect, useState } from 'react';

const ENABLED_BUILD = import.meta.env.VITE_TP_DEBUG === '1';
const FLAG_KEY = 'tp_layout';

function flagOn(): boolean {
  if (!ENABLED_BUILD) return false;
  try {
    if (new URLSearchParams(window.location.search).get(FLAG_KEY) === '1') {
      sessionStorage.setItem(FLAG_KEY, '1');
    }
    return sessionStorage.getItem(FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

const q = (name: string) => document.querySelector<HTMLElement>(`[data-tp-layout="${name}"]`);
const r = (n: number) => Math.round(n);
const box = (el: HTMLElement | null) => {
  if (!el) return 'none';
  const b = el.getBoundingClientRect();
  return `${r(b.top)}–${r(b.bottom)}`;
};

// Any element in the overlay that clips or scrolls its content: the "hard line" suspects.
function clippers(overlay: HTMLElement | null): string[] {
  if (!overlay) return [];
  const out: string[] = [];
  for (const el of [overlay, ...Array.from(overlay.querySelectorAll<HTMLElement>('*'))]) {
    const cs = getComputedStyle(el);
    const clips = cs.overflowY !== 'visible' || cs.maxHeight !== 'none';
    if (!clips || el.scrollHeight <= el.clientHeight + 1) continue;
    const name = el.dataset.tpLayout ?? el.tagName.toLowerCase();
    out.push(`${name} ovY=${cs.overflowY} maxH=${cs.maxHeight} ${el.clientHeight}/${el.scrollHeight} st=${r(el.scrollTop)}`);
  }
  return out;
}

// What covers the bottom of the visible area (a fixed bar, the toolbar gap, ...).
function bottomHit(): string {
  const vv = window.visualViewport;
  const y = vv ? vv.offsetTop + vv.height - 4 : window.innerHeight - 4;
  const el = document.elementFromPoint(window.innerWidth / 2, Math.min(y, window.innerHeight - 1)) as HTMLElement | null;
  if (!el) return 'nothing';
  const owner = el.closest<HTMLElement>('[data-tp-layout]');
  const pos = getComputedStyle(el).position;
  return `${owner?.dataset.tpLayout ?? '-'} > ${el.tagName.toLowerCase()} (${pos})`;
}

function read(): string[] {
  const vv = window.visualViewport;
  const ov = q('overlay');
  const list = q('list');
  const bundle = document.querySelector<HTMLScriptElement>('script[src*="/assets/index-"]')?.src.split('/').pop() ?? '?';
  const sw = navigator.serviceWorker?.controller ? 'ctrl' : 'none';
  return [
    `bundle ${bundle} sw:${sw}`,
    `inner ${window.innerHeight} vv ${vv ? `${r(vv.height)} @${r(vv.offsetTop)}` : 'n/a'}`,
    ov
      ? `ov h=${ov.style.height || '-'} top=${ov.style.top || '-'} ch=${ov.clientHeight} sh=${ov.scrollHeight} st=${r(ov.scrollTop)}`
      : 'ov none',
    `card ${box(q('card'))}`,
    `filter ${box(q('filter'))}`,
    `list ${box(list)} by ${list?.dataset.tpComponent ?? '-'}`,
    `bottom: ${bottomHit()}`,
    ...clippers(ov).map((c) => `clip ${c}`),
  ];
}

function LayoutDebugReadout() {
  const [on] = useState(flagOn);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!on) return;
    const update = () => setLines(read());
    update();
    const id = window.setInterval(update, 250);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    document.addEventListener('scroll', update, true);
    return () => {
      window.clearInterval(id);
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      document.removeEventListener('scroll', update, true);
    };
  }, [on]);

  if (!on) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 4,
        right: 4,
        zIndex: 10000,
        maxWidth: 230,
        padding: '4px 6px',
        borderRadius: 6,
        background: 'rgba(0,0,0,0.82)',
        border: '1px solid rgba(255,214,0,0.6)',
        color: '#ffd600',
        font: '9px/1.3 ui-monospace, Menlo, monospace',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        pointerEvents: 'none',
      }}
    >
      {lines.join('\n')}
    </div>
  );
}

// A constant branch, so production builds drop the readout and its helpers.
export const LayoutDebug: () => React.ReactElement | null = ENABLED_BUILD ? LayoutDebugReadout : () => null;

export default LayoutDebug;
