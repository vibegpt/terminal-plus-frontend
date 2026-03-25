import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

describe('useVibeAmenities', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  it('fetches amenities for a specific vibe', async () => {
    const mockHook = () => ({
      loading: false,
      vibesWithAmenities: new Map([['refuel', []]]),
      error: null,
    });

    const { result } = renderHook(mockHook, { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.vibesWithAmenities.size).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('handles errors gracefully', async () => {
    const mockHook = () => ({
      loading: false,
      vibesWithAmenities: new Map(),
      error: 'Failed to load amenities',
    });

    const { result } = renderHook(mockHook, { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain('Failed to load amenities');
  });
});
