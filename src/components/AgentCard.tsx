// src/components/AgentCard.tsx
// The agent card (CC-25), in two variants:
// - AgentCardInline: Home, at the top, expanded. A skeleton while a request is out.
// - AgentCardStrip: every other page, in the sticky header slot. A compact strip;
//   tapping it opens a bottom sheet with the full card.
// Never a modal on arrival, never a scroll lock; dismiss is always there.
// All copy is in src/lib/agentCardCopy.ts.

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, RefreshCw, ChevronRight, Sparkles } from 'lucide-react';
import { useAgentCardSlot } from '@/hooks/useAgentCards';
import { AGENT_CARD_COPY, terminalShort } from '@/lib/agentCardCopy';
import { isPagePath } from '@/lib/routes';
import type { CardEntry } from '@/lib/agentCards';

const C = {
  bg: 'rgba(124,109,250,0.10)',
  border: '1px solid rgba(124,109,250,0.28)',
  text: '#f0f0f8',
  dim: 'rgba(255,255,255,0.55)',
  faint: 'rgba(255,255,255,0.38)',
};

const CHIP: React.CSSProperties = {
  padding: '7px 13px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.06)',
  color: C.text,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

const ICON_BTN: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'rgba(255,255,255,0.5)',
  cursor: 'pointer',
  padding: 6,
  display: 'flex',
};

function CardBody({ entry, onAfterAction }: { entry: CardEntry; onAfterAction?: () => void }) {
  const slot = useAgentCardSlot();
  const { card } = entry;
  const canSwap = card.alternates.length > 0;
  const after = (fn: () => void) => () => { fn(); onAfterAction?.(); };

  return (
    <div data-testid="agent-card" data-trigger={card.trigger} data-source={card.source} data-card-id={card.card_id}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a99cff' }}>
            {AGENT_CARD_COPY.title[card.trigger]}
          </div>
          <div data-testid="agent-card-header" style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{card.header}</div>
        </div>
        <button type="button" aria-label={AGENT_CARD_COPY.dismissAria} onClick={after(slot.dismiss)} style={ICON_BTN}>
          <X size={16} />
        </button>
      </div>

      <p data-testid="agent-card-line" style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: '8px 0 0' }}>{card.line}</p>
      {card.trigger === 'gate_change' && entry.terminal_changed && (
        <p data-testid="agent-card-skytrain" style={{ fontSize: 13, color: '#fbbf24', margin: '4px 0 0' }}>{AGENT_CARD_COPY.gate.newTerminal}</p>
      )}

      {card.stops.length > 0 && (
        <ol style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {card.stops.map((s, i) => (
            <li key={`${s.slug}-${i}`} data-testid="agent-card-stop" data-slug={s.slug}
              style={{ display: 'flex', alignItems: 'stretch', gap: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
              <button
                type="button"
                aria-label={AGENT_CARD_COPY.stop.open(s.name)}
                onClick={after(() => slot.tapStop(i))}
                style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: '9px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: C.faint, flexShrink: 0 }}>{terminalShort(s.terminal_code)}</span>
                </div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{s.why}</div>
                {(s.access_label || s.opens_label) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {s.access_label && <span data-testid="agent-card-access" style={{ fontSize: 10, fontWeight: 600, color: '#fbbf24' }}>{s.access_label}</span>}
                    {s.opens_label && <span data-testid="agent-card-opens" style={{ fontSize: 10, fontWeight: 600, color: '#7dd3fc' }}>{s.opens_label}</span>}
                  </div>
                )}
              </button>
              {canSwap && (
                <button type="button" aria-label={AGENT_CARD_COPY.stop.swapAria(s.name)} onClick={() => slot.swap(i)}
                  style={{ ...ICON_BTN, alignItems: 'center', padding: '0 10px', fontSize: 11, gap: 4, color: C.dim }}>
                  <RefreshCw size={12} /> {AGENT_CARD_COPY.stop.swap}
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {card.chips.map(chip => (
          <button
            key={chip.kind}
            type="button"
            style={CHIP}
            onClick={after(chip.kind === 'ask_else' ? slot.askElse : chip.kind === 'quick_options' ? slot.quickOptions : slot.dismiss)}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div data-testid="agent-card-skeleton" aria-label={AGENT_CARD_COPY.loading}
      style={{ padding: 14, borderRadius: 14, background: C.bg, border: C.border }}>
      <div className="animate-pulse" style={{ height: 10, width: 90, borderRadius: 4, background: 'rgba(255,255,255,0.12)' }} />
      <div className="animate-pulse" style={{ height: 14, width: '70%', borderRadius: 4, background: 'rgba(255,255,255,0.10)', marginTop: 10 }} />
      {[0, 1].map(i => (
        <div key={i} className="animate-pulse" style={{ height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.05)', marginTop: 8 }} />
      ))}
    </div>
  );
}

/** Home: at the top, expanded. */
export function AgentCardInline() {
  const slot = useAgentCardSlot();
  const { register } = slot;
  useEffect(() => register('inline'), [register]);

  if (slot.visible && slot.visible !== 'strip') {
    return (
      <section role="region" aria-label={AGENT_CARD_COPY.regionAria} className="px-4 pt-2 pb-1">
        <div style={{ padding: 14, borderRadius: 14, background: C.bg, border: C.border }}>
          <CardBody entry={slot.visible} />
        </div>
      </section>
    );
  }
  if (!slot.visible && slot.loading) {
    return <section className="px-4 pt-2 pb-1"><Skeleton /></section>;
  }
  return null;
}

function stripText(entry: CardEntry): string {
  const { card } = entry;
  const s = AGENT_CARD_COPY.strip;
  switch (card.trigger) {
    case 'plan': return s.plan(card.stops[0]?.terminal_code ?? '', card.stops.length);
    case 'delay': return s.delay(card.stops.length);
    case 'next_stop': return s.next_stop(card.stops.length);
    case 'gate_change': return card.line;
    case 'final_call': return s.final_call();
  }
}

/** Other pages: a compact strip in the sticky slot; tap opens the full card in a bottom sheet. */
export function AgentCardStrip() {
  const slot = useAgentCardSlot();
  const { register } = slot;
  const { pathname } = useLocation();
  const onPage = isPagePath(pathname);
  const [open, setOpen] = useState(false);

  useEffect(() => (onPage ? register('strip') : undefined), [onPage, register]);
  const entry = slot.visible && slot.visible !== 'strip' ? slot.visible : null;
  useEffect(() => { if (!entry) setOpen(false); }, [entry]);
  // Home draws the card inline.
  if (!onPage || !entry) return null;

  return (
    <>
      <div role="region" aria-label={AGENT_CARD_COPY.regionAria} data-testid="agent-card-strip" data-trigger={entry.card.trigger}
        style={{ marginTop: 8, padding: '8px 8px 8px 12px', borderRadius: 12, background: C.bg, border: C.border, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" onClick={() => { slot.expand(); setOpen(true); }}
          style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
          <Sparkles size={14} color="#a99cff" />
          <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {stripText(entry)}
          </span>
          <ChevronRight size={16} color={C.dim} />
        </button>
        <button type="button" aria-label={AGENT_CARD_COPY.dismissAria} onClick={slot.dismiss} style={ICON_BTN}>
          <X size={16} />
        </button>
      </div>

      {open && (
        <div data-testid="agent-card-sheet" style={{ position: 'fixed', inset: 0, zIndex: 80 }}>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '80vh', overflowY: 'auto',
            background: '#14141c', borderTopLeftRadius: 18, borderTopRightRadius: 18, border: C.border,
            padding: '14px 16px calc(16px + env(safe-area-inset-bottom))',
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 12px' }} />
            <CardBody entry={entry} onAfterAction={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
