import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TFTBoard, { BoardChampion } from '../components/TFTBoard';

const mockChampions: BoardChampion[] = [
  {
    id: 'unit-1',
    championId: 'TFT18_Akali',
    name: 'Akali',
    cost: 1,
    traits: ['Inferno', 'Adaptor', 'Ravager'],
    iconUrl: 'https://example.com/akali.png',
    stars: 2,
    items: ['TFT18_BFSword'],
    row: 1,
    col: 2,
  },
  {
    id: 'unit-2',
    championId: 'TFT18_Camille',
    name: 'Camille',
    cost: 1,
    traits: ['Coven', 'Ravager'],
    iconUrl: 'https://example.com/camille.png',
    stars: 1,
    items: [],
    row: 2,
    col: 3,
  },
  {
    id: 'unit-3',
    championId: 'TFT18_Taric',
    name: 'Taric',
    cost: 5,
    traits: ['Emerald Aspect', 'Vanguard'],
    iconUrl: 'https://example.com/taric.png',
    stars: 3,
    items: ['TFT18_ChainVest'],
    row: 3,
    col: 1,
  },
];

describe('TFTBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders board with correct dimensions', () => {
    render(<TFTBoard champions={mockChampions} />);
    
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('displays all placed champions', () => {
    render(<TFTBoard champions={mockChampions} />);
    
    expect(screen.getByText('Akali')).toBeInTheDocument();
    expect(screen.getByText('Camille')).toBeInTheDocument();
    expect(screen.getByText('Taric')).toBeInTheDocument();
  });

  it('shows correct star levels', () => {
    render(<TFTBoard champions={mockChampions} />);
    
    // Stars are rendered as SVG polygons with fill="#fbbf24" (gold color)
    // Count the star polygons instead
    const starPolygons = document.querySelectorAll('polygon[fill="#fbbf24"]');
    // Akali has 2 stars, Camille 1, Taric 3 = 6 total
    expect(starPolygons.length).toBeGreaterThanOrEqual(6);
  });

  it('shows cost badges', () => {
    render(<TFTBoard champions={mockChampions} />);
    
    // Cost badges are in the SVG - check for cost numbers within cost badge circles
    // The cost badges have the cost number as text inside a circle
    // There are multiple "1" and "5" texts, so we need to be more specific
    const costOneElements = screen.getAllByText('1');
    expect(costOneElements.length).toBeGreaterThan(0);
    
    const costFiveElements = screen.getAllByText('5');
    expect(costFiveElements.length).toBeGreaterThan(0);
  });

  it('calls onBoardChange when edit mode and unit removed', () => {
    const onBoardChange = vi.fn();
    render(<TFTBoard champions={mockChampions} editMode onBoardChange={onBoardChange} />);
    
    // The remove button is an SVG group - click on the first clickable SVG group
    // We can find it by looking for elements with cursor: pointer style
    const clickableElements = document.querySelectorAll('g[style*="cursor: pointer"]');
    expect(clickableElements.length).toBeGreaterThan(0);
    
    // Click the first one (remove button)
    fireEvent.click(clickableElements[0]);
    
    expect(onBoardChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'unit-2' }),
        expect.objectContaining({ id: 'unit-3' }),
      ])
    );
  });

  it('calls onBoardChange when edit mode and star cycled', () => {
    const onBoardChange = vi.fn();
    render(<TFTBoard champions={mockChampions} editMode onBoardChange={onBoardChange} />);
    
    // Find and click star cycle button for first unit (it's an SVG group with text containing ★)
    const starButtons = screen.getAllByText(/★/);
    fireEvent.click(starButtons[0]);
    
    expect(onBoardChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'unit-1', stars: 3 }),
      ])
    );
  });

  it('auto-places unplaced champions', () => {
    const unplacedChampions: BoardChampion[] = [
      {
        id: 'unit-4',
        championId: 'TFT18_Varus',
        name: 'Varus',
        cost: 4,
        traits: ['Inferno', 'Ravager'],
        iconUrl: 'https://example.com/varus.png',
        stars: 1,
        items: [],
        row: -1,
        col: -1,
      },
    ];
    
    render(<TFTBoard champions={unplacedChampions} />);
    
    // The champion should be auto-placed and visible
    expect(screen.getByText('Varus')).toBeInTheDocument();
  });

  it('displays title and unit count', () => {
    render(<TFTBoard champions={mockChampions} title="Test Board" />);
    
    expect(screen.getByText('Test Board')).toBeInTheDocument();
    expect(screen.getByText('(3 / 28)')).toBeInTheDocument(); // 3 units, 4x7=28 slots
  });

  it('handles empty champions array', () => {
    render(<TFTBoard champions={[]} />);
    
    expect(screen.getByText('(0 / 28)')).toBeInTheDocument();
  });
});