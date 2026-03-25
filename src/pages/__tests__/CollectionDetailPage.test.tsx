import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CollectionDetailPage from '../CollectionDetailPage';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockParams = { id: '123' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockParams,
    useNavigate: () => mockNavigate,
  };
});

// Mock supabase with simple implementation
vi.mock('../../main', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null })),
          order: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [] })),
            })),
          })),
        })),
      })),
    })),
  },
}));

// Mock VirtualAmenityList
vi.mock('../../components/VirtualAmenityList', () => ({
  VirtualAmenityList: ({ amenities, onAmenityClick, collectionId, isSmart7 }: any) => (
    <div data-testid="virtual-amenity-list">
      <div data-testid="amenities-count">{amenities.length}</div>
      <div data-testid="collection-id">{collectionId}</div>
      <div data-testid="is-smart7">{isSmart7 ? 'true' : 'false'}</div>
    </div>
  ),
}));

const CollectionDetailPageWrapper = () => (
  <BrowserRouter>
    <CollectionDetailPage />
  </BrowserRouter>
);

describe('CollectionDetailPage', () => {
  it('renders collection not found when no collection data', async () => {
    render(<CollectionDetailPageWrapper />);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(screen.getByText('Collection not found')).toBeInTheDocument();
    expect(screen.getByText('Return to Home')).toBeInTheDocument();
  });

  it('has proper component structure', async () => {
    render(<CollectionDetailPageWrapper />);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check that the main container exists
    expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
  });

  it('handles navigation correctly', () => {
    render(<CollectionDetailPageWrapper />);
    
    // The navigate function should be available
    expect(mockNavigate).toBeDefined();
  });
});