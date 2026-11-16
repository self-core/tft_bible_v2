import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CompositionDetail from '../pages/CompositionDetail';
import { useCompositionsStore } from '../stores/compositionsStore';
import { ThemeProvider } from '../contexts/ThemeContext';

vi.mock('../stores/compositionsStore');

const mockComposition = {
  id: 'test-comp-1',
  title: 'Blossom Ravagers',
  description: 'A strong Blossom Ravager composition for Set 18',
  setId: 18,
  category: 'Reroll',
  meta: {
    winrate: 52.3,
    avg_placement: 3.8,
    playrate: 0.05,
    contest_rate: 0.12,
    difficulty: 3,
    playstyle: 'Standard',
    patch: '14.18',
    cost: 28,
    tier: 'A',
  },
  champions: [
    { id: 'TFT18_Akali', name: 'Akali', star_level: 2, position: { x: 2, y: 1 }, items: ['TFT18_EdgeOfNight'], is_core: true, priority: 'High', cost: 1, traits: ['Inferno', 'Adaptor', 'Ravager'], health: 600, attack_damage: 55, ability_name: 'Kunai Strike', icon_url: 'https://example.com/akali.png' },
    { id: 'TFT18_Camille', name: 'Camille', star_level: 2, position: { x: 3, y: 1 }, items: ['TFT18_BFSword'], is_core: true, priority: 'High', cost: 1, traits: ['Coven', 'Ravager'], health: 650, attack_damage: 60, ability_name: 'Defensive Sweep', icon_url: 'https://example.com/camille.png' },
    { id: 'TFT18_Taric', name: 'Taric', star_level: 3, position: { x: 1, y: 2 }, items: ['TFT18_ChainVest'], is_core: true, priority: 'High', cost: 5, traits: ['Emerald Aspect', 'Vanguard'], health: 900, attack_damage: 70, ability_name: 'Emerald Radiance', icon_url: 'https://example.com/taric.png' },
  ],
  augments: {
    preferred: ['Wisp Catalyst', 'Beast Tamer'],
  },
  tags: ['Blossom', 'Ravager', 'Carry'],
  views: 1234,
  votes: { upvotes: 42, downvotes: 3 },
};

describe('CompositionDetail', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter initialEntries={['/compositions/test-comp-1']}>
        <ThemeProvider>
          {ui}
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('shows loading state initially', () => {
    (useCompositionsStore as any).mockReturnValue({
      currentComposition: null,
      loading: true,
      error: null,
      fetchCompositionById: vi.fn(),
      clearCurrentComposition: vi.fn(),
    });

    const { container } = renderWithProviders(<CompositionDetail />);

    // Loading state shows a spinner div with animate-spin class
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows error state when composition not found', () => {
    (useCompositionsStore as any).mockReturnValue({
      currentComposition: null,
      loading: false,
      error: 'Not found',
      fetchCompositionById: vi.fn(),
      clearCurrentComposition: vi.fn(),
    });

    renderWithProviders(<CompositionDetail />);

    expect(screen.getByText(/composition not found/i)).toBeInTheDocument();
    expect(screen.getByText(/back to compositions/i)).toBeInTheDocument();
  });

  it('renders composition details when loaded', () => {
    (useCompositionsStore as any).mockReturnValue({
      currentComposition: mockComposition,
      loading: false,
      error: null,
      fetchCompositionById: vi.fn(),
      clearCurrentComposition: vi.fn(),
    });

    renderWithProviders(<CompositionDetail />);

    expect(screen.getByText('Blossom Ravagers')).toBeInTheDocument();
    
    const descriptionElements = screen.getAllByText(/a strong blossom ravager composition/i);
    expect(descriptionElements.length).toBeGreaterThan(0);
    
    const rerollElements = screen.getAllByText(/reroll/i);
    expect(rerollElements.length).toBeGreaterThan(0);
    
    const tierElements = screen.getAllByText('A Tier');
    expect(tierElements.length).toBeGreaterThan(0);
  });

  it('displays composition stats', () => {
      (useCompositionsStore as any).mockReturnValue({
        currentComposition: mockComposition,
        loading: false,
        error: null,
        fetchCompositionById: vi.fn(),
        clearCurrentComposition: vi.fn(),
      });

      renderWithProviders(<CompositionDetail />);

      const winrateElements = screen.getAllByText(/52\.3%/);
      expect(winrateElements.length).toBeGreaterThan(0);

      const placementElements = screen.getAllByText(/3\.8/);
      expect(placementElements.length).toBeGreaterThan(0);

      const viewsElements = screen.getAllByText(/1234/);
      expect(viewsElements.length).toBeGreaterThan(0);

      const upvotesElements = screen.getAllByText(/42/);
      expect(upvotesElements.length).toBeGreaterThan(0);
    });

  it('displays active traits', () => {
    (useCompositionsStore as any).mockReturnValue({
      currentComposition: mockComposition,
      loading: false,
      error: null,
      fetchCompositionById: vi.fn(),
      clearCurrentComposition: vi.fn(),
    });

    renderWithProviders(<CompositionDetail />);

    expect(screen.getByText(/active traits/i)).toBeInTheDocument();
    const blossomElements = screen.getAllByText(/blossom/i);
    expect(blossomElements.length).toBeGreaterThan(0);
    
    const ravagerElements = screen.getAllByText(/ravager/i);
    expect(ravagerElements.length).toBeGreaterThan(0);
    
    const covenElements = screen.getAllByText(/coven/i);
    expect(covenElements.length).toBeGreaterThan(0);
  });

  it('displays champions with details', () => {
    (useCompositionsStore as any).mockReturnValue({
      currentComposition: mockComposition,
      loading: false,
      error: null,
      fetchCompositionById: vi.fn(),
      clearCurrentComposition: vi.fn(),
    });

    renderWithProviders(<CompositionDetail />);

    // The page should contain champion names - verify they're rendered somewhere
    // Using getAllByText and checking at least one exists
    const akaliElements = screen.getAllByText('Akali');
    expect(akaliElements.length).toBeGreaterThan(0);
    
    const camilleElements = screen.getAllByText('Camille');
    expect(camilleElements.length).toBeGreaterThan(0);
    
    const taricElements = screen.getAllByText('Taric');
    expect(taricElements.length).toBeGreaterThan(0);
  });

  it('displays recommended augments', () => {
    (useCompositionsStore as any).mockReturnValue({
      currentComposition: mockComposition,
      loading: false,
      error: null,
      fetchCompositionById: vi.fn(),
      clearCurrentComposition: vi.fn(),
    });

    renderWithProviders(<CompositionDetail />);

    expect(screen.getByText(/recommended augments/i)).toBeInTheDocument();
    expect(screen.getByText('Wisp Catalyst')).toBeInTheDocument();
    expect(screen.getByText('Beast Tamer')).toBeInTheDocument();
  });

  it('displays strategy details', () => {
    (useCompositionsStore as any).mockReturnValue({
      currentComposition: mockComposition,
      loading: false,
      error: null,
      fetchCompositionById: vi.fn(),
      clearCurrentComposition: vi.fn(),
    });

    renderWithProviders(<CompositionDetail />);

    expect(screen.getByText(/strategy details/i)).toBeInTheDocument();
    expect(screen.getByText(/reroll composition/i)).toBeInTheDocument();
    expect(screen.getByText(/medium difficulty/i)).toBeInTheDocument();
  });

  it('displays performance metrics', () => {
    (useCompositionsStore as any).mockReturnValue({
      currentComposition: mockComposition,
      loading: false,
      error: null,
      fetchCompositionById: vi.fn(),
      clearCurrentComposition: vi.fn(),
    });

    renderWithProviders(<CompositionDetail />);

    expect(screen.getByText(/win rate/i)).toBeInTheDocument();
    expect(screen.getByText(/avg placement/i)).toBeInTheDocument();
    expect(screen.getByText(/play rate/i)).toBeInTheDocument();
    expect(screen.getByText(/contest rate/i)).toBeInTheDocument();
  });

  it('displays tags', () => {
    (useCompositionsStore as any).mockReturnValue({
      currentComposition: mockComposition,
      loading: false,
      error: null,
      fetchCompositionById: vi.fn(),
      clearCurrentComposition: vi.fn(),
    });

    renderWithProviders(<CompositionDetail />);

    expect(screen.getByText(/tags/i)).toBeInTheDocument();
    // Tags are rendered in a specific section, so look for them there
    const tagsSection = screen.getByText(/tags/i).closest('div');
    expect(tagsSection).toBeInTheDocument();
    expect(tagsSection).toHaveTextContent('Blossom');
    expect(tagsSection).toHaveTextContent('Ravager');
    expect(tagsSection).toHaveTextContent('Carry');
  });
});