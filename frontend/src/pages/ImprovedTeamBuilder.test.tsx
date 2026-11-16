import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import ImprovedTeamBuilder from './ImprovedTeamBuilder';

vi.mock('../stores/championsStore', () => {
  const fetchChampions = vi.fn(() => Promise.resolve());
  return {
    useChampionsStore: (selector: (state: unknown) => unknown = (state) => state) => selector({
      champions: [
        {
          id: 'TFT18_Puff',
          name: 'Puff',
          cost: 2,
          traits: ['Wisp', 'Mage'],
          stats: { hp: 600, mana: 40, damage: 50 },
          ability: { name: 'Puff', description: '', variables: [] },
          iconUrl: null,
          imageUrl: null,
        },
        {
          id: 'TFT18_Akali',
          name: 'Akali',
          cost: 1,
          traits: ['Inferno'],
          stats: { hp: 600, mana: 40, damage: 50 },
          ability: { name: 'Kunai Strike', description: '', variables: [] },
          iconUrl: null,
          imageUrl: null,
        },
      ],
      loading: false,
      error: null,
      fetchChampions,
    }),
  };
});

vi.mock('../stores/traitsStore', () => {
  const fetchTraits = vi.fn(() => Promise.resolve());
  return {
    useTraitsStore: (selector: (state: unknown) => unknown = (state) => state) => selector({
      traits: [
        { key: 'Wisp', name: 'Wisp', description: '', breakpoints: [{ count: 3, bonus: 'Wisps are upgraded' }] },
        { key: 'Mage', name: 'Mage', description: '', breakpoints: [{ count: 2, bonus: 'Mages cast twice' }] },
        { key: 'Inferno', name: 'Inferno', description: '', breakpoints: [{ count: 2, bonus: 'Burn enemies' }] },
      ],
      loading: false,
      error: null,
      fetchTraits,
    }),
  };
});

vi.mock('../stores/itemsStore', () => {
  const fetchItems = vi.fn(() => Promise.resolve());
  const item = (id: string, name: string) => ({
    id,
    name,
    description: '',
    components: [],
    effects: [],
  });
  return {
    useItemsStore: (selector: (state: unknown) => unknown = (state) => state) => selector({
      items: [
        item('TFT18_BFSword', 'B.F. Sword'),
        item('TFT18_EdgeOfNight', 'Edge of Night'),
        item('TFT18_ChainVest', 'Chain Vest'),
        item('TFT18_GiantBelt', "Giant's Belt"),
      ],
      loading: false,
      error: null,
      fetchItems,
    }),
  };
});

const originalElementsFromPoint = (document as any).elementsFromPoint;
let dropId = 'cell-2-3';

function dragPaletteTo(championId: string, targetDropId: string) {
  const tile = screen.getByTestId(`palette-${championId}`);
  fireEvent.pointerDown(tile, {
    button: 0, clientX: 5, clientY: 5, pointerId: 1, pointerType: 'mouse',
  });
  dropId = targetDropId;
  fireEvent.pointerMove(window, { clientX: 90, clientY: 90, pointerId: 1, pointerType: 'mouse' });
  fireEvent.pointerUp(window, { clientX: 90, clientY: 90, pointerId: 1, pointerType: 'mouse' });
}

function openUnitConfig(name = 'Puff') {
  const unit = screen.getByText(name);
  fireEvent.pointerDown(unit, {
    button: 0, clientX: 20, clientY: 20, pointerId: 1, pointerType: 'mouse',
  });
  fireEvent.pointerUp(window, { clientX: 20, clientY: 20, pointerId: 1, pointerType: 'mouse' });
  fireEvent.click(unit);
  return screen.getByTestId('unit-config');
}

function assignItem(slot: number, itemId: string) {
  fireEvent.click(screen.getByTestId(`item-slot-${slot}`));
  fireEvent.click(screen.getByTestId(`item-option-${itemId}`));
}

describe('ImprovedTeamBuilder', () => {
  beforeEach(() => {
    dropId = 'cell-2-3';
    (document as any).elementsFromPoint = () => {
      const element = document.querySelector(`[data-drop-id="${dropId}"]`);
      return element ? [element] : [];
    };
  });

  afterEach(() => {
    cleanup();
    (document as any).elementsFromPoint = originalElementsFromPoint;
  });

  it('opens unit config when a placed unit is clicked', () => {
    render(<ImprovedTeamBuilder />);

    dragPaletteTo('TFT18_Puff', 'cell-2-3');
    const popover = openUnitConfig();

    expect(popover).toBeInTheDocument();
    expect(within(popover).getByText('Puff')).toBeInTheDocument();
  });

  it('assigns an item to the unit', () => {
    render(<ImprovedTeamBuilder />);

    dragPaletteTo('TFT18_Puff', 'cell-2-3');
    openUnitConfig();
    assignItem(0, 'TFT18_BFSword');

    expect(screen.getByTestId('item-slot-0')).toHaveAttribute('data-filled', 'true');
    expect(within(screen.getByTestId('item-slot-0')).getByText('B.F. Sword')).toBeInTheDocument();
  });

  it('never allows more than three items', () => {
    render(<ImprovedTeamBuilder />);

    dragPaletteTo('TFT18_Puff', 'cell-2-3');
    openUnitConfig();
    assignItem(0, 'TFT18_BFSword');
    assignItem(1, 'TFT18_EdgeOfNight');
    assignItem(2, 'TFT18_ChainVest');

    expect(screen.getByText('3 / 3 items')).toBeInTheDocument();
    expect(screen.queryByTestId('item-slot-3')).toBeNull();
    expect(within(screen.getByTestId('item-slots')).getAllByTestId(/^item-slot-/)).toHaveLength(3);
  });

  it('carries palette traits into the placed unit', () => {
    render(<ImprovedTeamBuilder />);

    dragPaletteTo('TFT18_Puff', 'cell-2-3');
    openUnitConfig();

    expect(screen.getByText(/Wisp, Mage/)).toBeInTheDocument();
  });

  it('clears both board and bench', () => {
    render(<ImprovedTeamBuilder />);

    dragPaletteTo('TFT18_Puff', 'cell-2-3');
    dragPaletteTo('TFT18_Puff', 'bench-0');

    expect(screen.getByText('· 1 on bench')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear Board'));

    expect(screen.getByText('(0 / 28)')).toBeInTheDocument();
    expect(screen.queryByText('Puff')).toBeNull();
    expect(screen.queryByText(/on bench/)).toBeNull();
  });

  it('shows active traits for units on the board', () => {
    render(<ImprovedTeamBuilder />);

    dragPaletteTo('TFT18_Puff', 'cell-2-3');

    const traitPanel = screen.getByTestId('trait-panel');
    expect(within(traitPanel).getByTestId('trait-Wisp')).toHaveTextContent('Wisp');
    expect(within(traitPanel).getByTestId('trait-Mage')).toHaveTextContent('Mage');
  });
});
