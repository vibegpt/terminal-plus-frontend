// src/components/LazyRouteBoundary.tsx
// Backstop around the lazy routes. A route chunk removed by a deploy has
// normally triggered one reload already (src/lib/chunkReload.ts). If it fails
// again inside the guard window, or anything else throws while a page renders,
// show a Reload button instead of a blank screen. App.tsx keys it by pathname,
// so moving to another page clears it.

import { Component, type ReactNode } from 'react';
import { isChunkLoadError, reloadOnce } from '@/lib/chunkReload';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  chunk: boolean;
}

export class LazyRouteBoundary extends Component<Props, State> {
  state: State = { hasError: false, chunk: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, chunk: isChunkLoadError(error) };
  }

  componentDidCatch(error: unknown) {
    // A chunk error that reached here unwrapped gets the same guarded reload.
    if (isChunkLoadError(error)) reloadOnce();
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 24,
          textAlign: 'center',
          color: '#f0f0f8',
        }}
      >
        <p style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>This page didn't load</p>
        <p style={{ fontSize: 13, color: 'rgba(240,240,248,0.6)', margin: 0, maxWidth: 280 }}>
          {this.state.chunk
            ? 'Terminal+ was updated while it was open.'
            : 'Something went wrong showing this page.'}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: 4,
            background: '#7c6dfa',
            color: '#fff',
            border: 'none',
            borderRadius: 999,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
