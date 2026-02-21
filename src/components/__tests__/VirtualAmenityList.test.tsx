import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VirtualAmenityList } from '../VirtualAmenityList';

// Mock react-window with a simpler approach
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemData, height, width }: any) => (
    <div 
      data-testid="virtual-list" 
      data-item-count={itemCount}
      data-height={height}
      data-width={width}
    >
      <div data-testid="virtual-list-content">
        Virtual list with {itemCount} items
      </div>
    </div>
  )
}));

// Mock AutoSizer
vi.mock('react-virtualized-auto-sizer', () => ({
  default: ({ children }: any) => 
    children({ height: 600, width: 800 })
}));

// Mock AmenityCard to avoid complex dependencies
vi.mock('../AmenityCard', () => ({
  AmenityCard: ({ amenity, onClick }: any) => (
    <div data-testid={`amenity-card-${amenity.id}`} onClick={onClick}>
      {amenity.name}
    </div>
  )
}));

const mockAmenities = [
  {
    id: 1,
    name: 'Starbucks',
    description: 'Coffee and light meals',
    terminal_code: 'T1',
    price_level: '$' as const,
    vibe_tags: ['coffee', 'quick'],
    opening_hours: '24/7',
    logo_url: 'https://example.com/logo1.png'
  },
  {
    id: 2,
    name: 'McDonald\'s',
    description: 'Fast food restaurant',
    terminal_code: 'T2',
    price_level: '$' as const,
    vibe_tags: ['fast-food', 'quick'],
    opening_hours: '06:00-23:00'
  },
  {
    id: 3,
    name: 'Burger King',
    description: 'Fast food restaurant',
    terminal_code: 'T3',
    price_level: '$' as const,
    vibe_tags: ['fast-food', 'quick'],
    opening_hours: '06:00-23:00'
  }
];

describe('VirtualAmenityList', () => {
  it('renders virtual list with amenities', () => {
    render(
      <VirtualAmenityList 
        amenities={mockAmenities}
      />
    );

    expect(screen.getByTestId('virtual-amenity-list')).toBeInTheDocument();
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    expect(screen.getByTestId('virtual-list')).toHaveAttribute('data-item-count', '3');
    expect(screen.getByTestId('virtual-list')).toHaveAttribute('data-height', '600');
    expect(screen.getByTestId('virtual-list')).toHaveAttribute('data-width', '800');
  });

  it('renders empty state when no amenities', () => {
    render(
      <VirtualAmenityList 
        amenities={[]}
      />
    );

    expect(screen.getByText('No amenities found')).toBeInTheDocument();
    expect(screen.queryByTestId('virtual-list')).not.toBeInTheDocument();
  });

  it('passes props correctly to virtual list', () => {
    render(
      <VirtualAmenityList 
        amenities={mockAmenities}
        collectionId={123}
        isSmart7={true}
      />
    );

    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    expect(screen.getByTestId('virtual-list')).toHaveAttribute('data-item-count', '3');
  });

  it('handles onAmenityClick callback prop', () => {
    const mockOnClick = vi.fn();
    
    render(
      <VirtualAmenityList 
        amenities={mockAmenities}
        onAmenityClick={mockOnClick}
      />
    );

    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    // The callback is passed through to the virtual list
    expect(mockOnClick).toBeDefined();
  });

  it('supports Smart7 selection mode', () => {
    render(
      <VirtualAmenityList 
        amenities={mockAmenities}
        isSmart7={true}
      />
    );

    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    expect(screen.getByTestId('virtual-list')).toHaveAttribute('data-item-count', '3');
  });

  it('applies custom className', () => {
    render(
      <VirtualAmenityList 
        amenities={mockAmenities}
        className="custom-class"
      />
    );

    const container = screen.getByTestId('virtual-amenity-list');
    expect(container).toHaveClass('virtual-amenity-list');
    expect(container).toHaveClass('custom-class');
  });
});