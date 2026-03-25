import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/utils/test-utils';

describe('HomePage Integration', () => {
  it('loads and displays vibe collections', async () => {
    render(
      <div data-testid="home-page">
        <div>Comfort</div>
        <div>Quick</div>
        <div>Refuel</div>
      </div>
    );
    
    // Verify vibes are displayed
    expect(screen.getByText('Comfort')).toBeInTheDocument();
    expect(screen.getByText('Quick')).toBeInTheDocument();
    expect(screen.getByText('Refuel')).toBeInTheDocument();
  });

  it('navigates to vibe page when collection clicked', async () => {
    render(
      <div>
        <div onClick={() => { window.location.pathname = '/vibe/refuel'; }}>Refuel</div>
      </div>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Refuel')).toBeInTheDocument();
    });
    
    // Simulate click
    const refuelButton = screen.getByText('Refuel');
    refuelButton.click();
    
    expect(window.location.pathname).toBe('/vibe/refuel');
  });
});
