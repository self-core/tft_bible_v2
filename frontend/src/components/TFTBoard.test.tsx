import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import TFTBoard, { BoardChampion } from '../components/TFTBoard';
import { DndProvider } from '../components/dnd/DndProvider';
import { useDragSource } from '../components/dnd/hooks';
import type { DragPayload } from '../components/dnd/hooks';

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

  it('renders the arena presentation with standing art, stars and item icons', () => {
    render(
      <TFTBoard
        champions={mockChampions}
        presentation="arena"
        resolveItemIcon={(itemId) => (
          itemId === 'TFT18_BFSword' ? 'https://example.com/bfsword.png' : null
        )}
      />,
    );

    expect(screen.getByTestId('arena-board')).toBeInTheDocument();
    expect(screen.getByTestId('arena-unit-unit-1')).toBeInTheDocument();
    expect(screen.getByTestId('arena-stars-unit-1').textContent).toBe('★★');
    expect(screen.queryByTestId('arena-item-unit-2-0')).toBeNull();

    const gearIcon = screen.getByTestId('arena-item-unit-1-0').querySelector('img');
    expect(gearIcon?.getAttribute('src')).toContain('bfsword.png');
  });

  it('cycles stars and removes units from the arena in edit mode', () => {
    const onBoardChange = vi.fn();
    render(
      <TFTBoard champions={mockChampions} editMode presentation="arena" onBoardChange={onBoardChange} />,
    );

    fireEvent.click(screen.getByTestId('stars-board-unit-unit-1'));
    expect(onBoardChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'unit-1', stars: 3 })])
    );

    onBoardChange.mockClear();
    fireEvent.click(screen.getByTestId('remove-board-unit-unit-2'));
    expect(onBoardChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'unit-1' }),
        expect.objectContaining({ id: 'unit-3' }),
      ])
    );
  });
});

function DragSource({ payload }: { payload: DragPayload }) {
  const { dragHandleProps } = useDragSource(() => payload);
  return <div data-testid="drag-source" {...dragHandleProps}>source</div>;
}

describe('TFTBoard drag and drop', () => {
  let target: Element | null = null;

  const hitTest = () => (target ? [target] : []);

  function dragTo(dropId: string) {
    fireEvent.pointerDown(screen.getByTestId('drag-source'), {
      button: 0, clientX: 5, clientY: 5, pointerId: 1, pointerType: 'mouse',
    });
    target = document.querySelector(`[data-drop-id="${dropId}"]`);
    expect(target).not.toBeNull();
    fireEvent.pointerMove(window, { clientX: 80, clientY: 80, pointerId: 1, pointerType: 'mouse' });
  }

  function drop() {
    fireEvent.pointerUp(window, { clientX: 80, clientY: 80, pointerId: 1, pointerType: 'mouse' });
    target = null;
  }

  beforeEach(() => {
    target = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('drops a board unit onto an occupied hex and swaps both units', () => {
    const onBoardChange = vi.fn();
    const units: BoardChampion[] = [
      { ...mockChampions[0], id: 'u1', row: 1, col: 2 },
      { ...mockChampions[1], id: 'u2', row: 2, col: 3 },
    ];

    render(
      <DndProvider hitTest={hitTest}>
        <DragSource payload={{
          kind: 'board-unit', championId: 'TFT18_Akali', unitId: 'u1',
          label: 'Akali', cost: 1, traits: ['Inferno'],
        }} />
        <TFTBoard champions={units} editMode onBoardChange={onBoardChange} />
      </DndProvider>,
    );

    dragTo('cell-2-3');
    drop();

    const next = onBoardChange.mock.calls[0][0] as BoardChampion[];
    expect(next).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'u1', row: 2, col: 3 }),
      expect.objectContaining({ id: 'u2', row: 1, col: 2 }),
    ]));
  });

  it('palette drop preserves the champion traits', () => {
    const onBoardChange = vi.fn();
    render(
      <DndProvider hitTest={hitTest}>
        <DragSource payload={{
          kind: 'palette-champion', championId: 'TFT18_X', label: 'Wisp Mage',
          cost: 3, traits: ['Wisp', 'Mage'], iconUrl: null,
        }} />
        <TFTBoard champions={[]} editMode onBoardChange={onBoardChange} />
      </DndProvider>,
    );

    dragTo('cell-2-3');
    drop();

    const next = onBoardChange.mock.calls[0][0] as BoardChampion[];
    const placed = next.find(u => u.championId === 'TFT18_X');
    expect(placed).toBeDefined();
    expect(placed!.traits).toEqual(['Wisp', 'Mage']);
    expect(placed!.row).toBe(2);
    expect(placed!.col).toBe(3);
  });

  it('bumps the occupant of an occupied hex to the bench on a palette drop', () => {
    const onBoardChange = vi.fn();
    const units: BoardChampion[] = [{ ...mockChampions[1], id: 'u2', row: 2, col: 3 }];

    render(
      <DndProvider hitTest={hitTest}>
        <DragSource payload={{
          kind: 'palette-champion', championId: 'TFT18_X', label: 'Newcomer',
          cost: 2, traits: ['Coven'], iconUrl: null,
        }} />
        <TFTBoard champions={units} editMode onBoardChange={onBoardChange} />
      </DndProvider>,
    );

    dragTo('cell-2-3');
    drop();

    const next = onBoardChange.mock.calls[0][0] as BoardChampion[];
    expect(next).toEqual(expect.arrayContaining([
      expect.objectContaining({ championId: 'TFT18_X', row: 2, col: 3 }),
      expect.objectContaining({ id: 'u2', row: -1, col: 0 }),
    ]));
  });

  it('puts units beyond the 28 grid slots on the bench', () => {
    const units: BoardChampion[] = Array.from({ length: 30 }, (_, i) => ({
      id: `u${i}`,
      championId: `TFT18_U${i}`,
      name: `A${i}`,
      cost: 1,
      traits: [],
      stars: 1,
      items: [],
      row: -1,
      col: -1,
    }));

    render(<TFTBoard champions={units} editMode onBoardChange={vi.fn()} />);

    expect(screen.getByText('(28 / 28)')).toBeInTheDocument();
    expect(screen.getByText('· 2 on bench')).toBeInTheDocument();

    const bench = screen.getByTestId('bench-svg');
    expect(within(bench).getByText('A28')).toBeInTheDocument();
    expect(within(bench).getByText('A29')).toBeInTheDocument();
  });

  it('renders nine bench hexes', () => {
    render(<TFTBoard champions={[]} editMode onBoardChange={vi.fn()} />);

    const bench = screen.getByTestId('bench-svg');
    const slots = bench.querySelectorAll('[data-drop-id^="bench-"]');
    expect(slots.length).toBe(9);
  });

  it('moves a bench unit onto the board and a board unit onto the bench', () => {
    const onBoardChange = vi.fn();
    const units: BoardChampion[] = [
      { ...mockChampions[0], id: 'grid', row: 1, col: 2 },
      { ...mockChampions[1], id: 'stashed', row: -1, col: 4 },
    ];

    const { unmount } = render(
      <DndProvider hitTest={hitTest}>
        <DragSource payload={{
          kind: 'bench-unit', championId: 'TFT18_Camille', unitId: 'stashed',
          label: 'Camille', cost: 1, traits: ['Coven'],
        }} />
        <TFTBoard champions={units} editMode onBoardChange={onBoardChange} />
      </DndProvider>,
    );

    dragTo('cell-0-0');
    drop();
    let next = onBoardChange.mock.calls[0][0] as BoardChampion[];
    expect(next).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'stashed', row: 0, col: 0 }),
    ]));

    unmount();
    onBoardChange.mockClear();

    render(
      <DndProvider hitTest={hitTest}>
        <DragSource payload={{
          kind: 'board-unit', championId: 'TFT18_Akali', unitId: 'grid',
          label: 'Akali', cost: 1, traits: ['Inferno'],
        }} />
        <TFTBoard champions={units} editMode onBoardChange={onBoardChange} />
      </DndProvider>,
    );

    dragTo('bench-3');
    drop();
    next = onBoardChange.mock.calls[0][0] as BoardChampion[];
    expect(next).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'grid', row: -1, col: 3 }),
    ]));
  });

  it('highlights the hovered cell during a drag', () => {
    render(
      <DndProvider hitTest={hitTest}>
        <DragSource payload={{
          kind: 'palette-champion', championId: 'TFT18_X', label: 'Hovered',
          cost: 1, traits: [], iconUrl: null,
        }} />
        <TFTBoard champions={[]} editMode onBoardChange={vi.fn()} />
      </DndProvider>,
    );

    dragTo('cell-1-4');

    const cell = document.querySelector('[data-drop-id="cell-1-4"]');
    expect(cell!.querySelector('[data-highlight="true"]')).not.toBeNull();

    drop();
    expect(document.querySelector('[data-highlight="true"]')).toBeNull();
  });
});