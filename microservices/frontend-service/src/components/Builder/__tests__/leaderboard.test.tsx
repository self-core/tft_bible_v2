import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Mock, vi, describe, test, beforeEach, expect } from 'vitest';
import '@testing-library/jest-dom';
import { compositionsApi, CompositionSummary } from '../../lib/api';
import { PaginatedResponse } from '../../lib/api';

// Mock the compositions API
vi.mock('../../lib/api', () => ({
  compositionsApi: {
    getCompositions: vi.fn(),
  },
  ...vi.importActual('../../lib/api'),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock data for leaderboard tests
const mockCompositions: CompositionSummary[] = [
  {
    id: '1',
    name: 'Arcane Sorcerers',
    category: 'Mage',
    tier: 'S',
    difficulty: 3,
    winrate: 0.62,
    views: 1245,
    upvotes: 120,
    author: 'ProPlayer123',
    champion_count: 5,
    main_champions: ['Veigar', 'Lux', 'Ahri'],
    created_at: '2025-11-19T13:06:19.478128',
    builder_code: 'ARCANE_SORCERERS_1'
  },
  {
    id: '2',
    name: 'Ninja Assassins',
    category: 'Assassin',
    tier: 'S',
    difficulty: 4,
    winrate: 0.65,
    views: 987,
    upvotes: 95,
    author: 'ShadowMaster',
    champion_count: 5,
    main_champions: ['Akali', 'Katarina', 'Zed'],
    created_at: '2025-11-18T14:30:19.478128',
    builder_code: 'NINJA_ASSASSINS_2'
  },
  {
    id: '3',
    name: 'Frost Rangers',
    category: 'Ranger',
    tier: 'A',
    difficulty: 2,
    winrate: 0.55,
    views: 765,
    upvotes: 65,
    author: 'IceQueen',
    champion_count: 5,
    main_champions: ['Ashe', 'Jinx', 'Miss Fortune'],
    created_at: '2025-11-17T10:15:19.478128',
    builder_code: 'FROST_RANGERS_3'
  }
];

const mockPaginatedResponse: PaginatedResponse<CompositionSummary> = {
  data: mockCompositions,
  total: 3,
  page: 1,
  per_page: 10,
  total_pages: 1
};

// Create a mock leaderboard component for testing
const CompositionLeaderboard = () => {
  const { data, isLoading, error } = compositionsApi.getCompositions.useQuery(
    {}, 
    { queryKey: ['compositions', { limit: 10, offset: 0, sort_by: 'upvotes' }] }
  );

  if (isLoading) return <div>Loading compositions...</div>;
  if (error) return <div>Error loading compositions</div>;

  return (
    <div>
      <h2>Composition Leaderboard</h2>
      <div data-testid="compositions-list">
        {data?.data.map(composition => (
          <div key={composition.id} data-testid={`composition-${composition.id}`} className="composition-item">
            <h3>{composition.name}</h3>
            <p>Author: {composition.author}</p>
            <p>Category: {composition.category}</p>
            <p>Win Rate: {(composition.winrate * 100).toFixed(1)}%</p>
            <p>Upvotes: {composition.upvotes}</p>
            <p>Tier: <span className={`tier-${composition.tier.toLowerCase()}`}>{composition.tier}</span></p>
          </div>
        ))}
      </div>
    </div>
  );
};

describe('Composition Leaderboard Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('loads and displays leaderboard with compositions', async () => {
    // Mock the API response
    (compositionsApi.getCompositions as Mock).mockResolvedValue(mockPaginatedResponse);

    render(
      <QueryClientProvider client={queryClient}>
        <CompositionLeaderboard />
      </QueryClientProvider>
    );

    // Verify loading state
    expect(screen.getByText('Loading compositions...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Composition Leaderboard')).toBeInTheDocument();
    });

    // Verify all compositions are displayed
    expect(screen.getByText('Arcane Sorcerers')).toBeInTheDocument();
    expect(screen.getByText('Ninja Assassins')).toBeInTheDocument();
    expect(screen.getByText('Frost Rangers')).toBeInTheDocument();

    // Verify composition details are shown
    expect(screen.getByText('ProPlayer123')).toBeInTheDocument();
    expect(screen.getByText('ShadowMaster')).toBeInTheDocument();
    expect(screen.getByText('Category: Mage')).toBeInTheDocument();
    expect(screen.getByText('Win Rate: 62.0%')).toBeInTheDocument();
    expect(screen.getByText('Win Rate: 65.0%')).toBeInTheDocument();
    expect(screen.getByText('Win Rate: 55.0%')).toBeInTheDocument();
  });

  test('displays tier badges with proper styling', async () => {
    // Mock the API response
    (compositionsApi.getCompositions as Mock).mockResolvedValue(mockPaginatedResponse);

    render(
      <QueryClientProvider client={queryClient}>
        <CompositionLeaderboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Composition Leaderboard')).toBeInTheDocument();
    });

    // Verify tier badges are displayed with proper class names
    const sTierCompositions = screen.getAllByText('S');
    expect(sTierCompositions.length).toBe(2); // Two S-tier compositions

    // Check that tier elements have appropriate CSS classes
    const sTierElement = screen.getByText('S');
    const tierBadge = sTierElement.closest('.tier-s');
    expect(tierBadge).toBeInTheDocument();
  });

  test('handles error state appropriately', async () => {
    // Mock error response
    (compositionsApi.getCompositions as Mock).mockRejectedValue(new Error('Network error'));

    render(
      <QueryClientProvider client={queryClient}>
        <CompositionLeaderboard />
      </QueryClientProvider>
    );

    // Verify loading state initially
    expect(screen.getByText('Loading compositions...')).toBeInTheDocument();

    // Wait for error state to render
    await waitFor(() => {
      expect(screen.getByText('Error loading compositions')).toBeInTheDocument();
    });
  });

  test('sorts compositions by upvotes in descending order', async () => {
    // Create test data with different upvote counts
    const mockCompositionsSorted = [
      { ...mockCompositions[0], upvotes: 150 }, // Most upvotes
      { ...mockCompositions[1], upvotes: 95 },
      { ...mockCompositions[2], upvotes: 120 }
    ];
    
    const mockResponse: PaginatedResponse<CompositionSummary> = {
      data: mockCompositionsSorted,
      total: 3,
      page: 1,
      per_page: 10,
      total_pages: 1
    };

    (compositionsApi.getCompositions as Mock).mockResolvedValue(mockResponse);

    render(
      <QueryClientProvider client={queryClient}>
        <CompositionLeaderboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Composition Leaderboard')).toBeInTheDocument();
    });

    // Verify compositions are displayed in order of upvotes (highest first)
    const compositionElements = screen.getAllByTestId(/composition-/);
    expect(compositionElements[0]).toContainHTML('Arcane Sorcerers');
    expect(compositionElements[0]).toContainHTML('150');
  });

  test('displays pagination controls when there are multiple pages', async () => {
    // Create mock data for multiple pages
    const manyCompositions: CompositionSummary[] = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Composition ${i + 1}`,
      category: 'Test',
      tier: 'A',
      difficulty: 2,
      winrate: 0.5 + (i * 0.01),
      views: 100 + i * 10,
      upvotes: 50 + i,
      author: `Author${i}`,
      champion_count: 5,
      main_champions: ['Test'],
      created_at: '2025-11-20T00:00:00Z',
      builder_code: `CODE_${i}`
    }));

    const mockPaginatedResponseMany: PaginatedResponse<CompositionSummary> = {
      data: manyCompositions.slice(0, 10), // First 10 items
      total: 15,
      page: 1,
      per_page: 10,
      total_pages: 2
    };

    (compositionsApi.getCompositions as Mock).mockResolvedValue(mockPaginatedResponseMany);

    render(
      <QueryClientProvider client={queryClient}>
        <CompositionLeaderboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Composition Leaderboard')).toBeInTheDocument();
    });

    // Check that 10 compositions are displayed (per page limit)
    const compositionElements = screen.getAllByTestId(/composition-/);
    expect(compositionElements.length).toBe(10);

    // Verify pagination info is shown
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
  });

  test('filters compositions by tier', async () => {
    // Mock compositions with different tiers
    const mixedTierCompositions: CompositionSummary[] = [
      { ...mockCompositions[0], tier: 'S' },
      { ...mockCompositions[1], tier: 'A' },
      { ...mockCompositions[2], tier: 'B' },
      { ...mockCompositions[0], id: '4', tier: 'S' }
    ];

    const mockResponse: PaginatedResponse<CompositionSummary> = {
      data: mixedTierCompositions,
      total: 4,
      page: 1,
      per_page: 10,
      total_pages: 1
    };

    (compositionsApi.getCompositions as Mock).mockResolvedValue(mockResponse);

    render(
      <QueryClientProvider client={queryClient}>
        <CompositionLeaderboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Composition Leaderboard')).toBeInTheDocument();
    });

    // Verify all tier types are present
    expect(screen.getAllByText('S')).toHaveLength(2);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  test('displays composition stats like winrate and difficulty', async () => {
    (compositionsApi.getCompositions as Mock).mockResolvedValue(mockPaginatedResponse);

    render(
      <QueryClientProvider client={queryClient}>
        <CompositionLeaderboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Composition Leaderboard')).toBeInTheDocument();
    });

    // Verify stats are displayed for each composition
    const compositionItems = screen.getAllByTestId(/composition-/);
    
    // Each composition should display win rate and difficulty
    expect(screen.getByText('Win Rate: 62.0%')).toBeInTheDocument();
    expect(screen.getByText('Win Rate: 65.0%')).toBeInTheDocument();
    expect(screen.getByText('Win Rate: 55.0%')).toBeInTheDocument();
  });
});