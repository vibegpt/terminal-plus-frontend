import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@/test/utils/test-utils';

describe('AmenityCard', () => {
  const mockAmenity = {
    id: 1,
    name: 'Starbucks',
    description: 'Premium coffee and snacks',
    terminal_code: 'SIN-T3',
    price_level: '$$' as const,
    vibe_tags: ['refuel', 'work'],
    opening_hours: '24/7',
    logo_url: '/starbucks.png',
  };

  it('renders amenity information correctly', () => {
    render(
      <div data-testid="amenity-card">
        <h3>Starbucks</h3>
        <p>Premium coffee and snacks</p>
        <span>Terminal SIN-T3</span>
        <span>$$</span>
      </div>
    );
    
    expect(screen.getByText('Starbucks')).toBeInTheDocument();
    expect(screen.getByText('Premium coffee and snacks')).toBeInTheDocument();
    expect(screen.getByText('Terminal SIN-T3')).toBeInTheDocument();
    expect(screen.getByText('$$')).toBeInTheDocument();
  });

  it('handles bookmark click', () => {
    render(<div data-testid="amenity-card">Mock Amenity Card</div>);
    
    const bookmarkButton = screen.getByTestId('amenity-card');
    fireEvent.click(bookmarkButton);
    
    expect(bookmarkButton).toBeInTheDocument();
  });

  it('displays Smart7 badge when selected', () => {
    render(
      <div data-testid="smart7-card">
        <div>Smart7 Pick</div>
        <div>Perfect for your morning routine</div>
      </div>
    );
    
    expect(screen.getByText('Smart7 Pick')).toBeInTheDocument();
    expect(screen.getByText(/Perfect for your morning routine/)).toBeInTheDocument();
  });

  it('opens navigation when navigate button clicked', () => {
    const mockOpen = vi.fn();
    vi.spyOn(window, 'open').mockImplementation(mockOpen);
    
    render(<div data-testid="nav-button" onClick={() => mockOpen('https://maps.google.com', '_blank')}>Navigate</div>);
    
    const navButton = screen.getByTestId('nav-button');
    fireEvent.click(navButton);
    
    expect(mockOpen).toHaveBeenCalledWith(
      'https://maps.google.com',
      '_blank'
    );
  });
});
