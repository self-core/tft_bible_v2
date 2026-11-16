import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import SandboxPage from './SandboxPage';
import { GET_ACTIVE_SET } from '../lib/graphql';

const champion = {
  __typename: 'Champion',
  id: 'TFT18_Akali',
  name: 'Akali',
  cost: 1,
  traits: ['Inferno', 'Ravager'],
  stats: {
    __typename: 'ChampionStats',
    hp: 600,
    mana: 50,
    damage: 55,
    armor: 25,
    magicResist: 25,
    attackSpeed: 0.7,
    range: 1,
    initialMana: 0,
    critChance: 0.25,
    critMultiplier: 1.4,
  },
  ability: {
    __typename: 'Ability',
    name: 'Kunai Strike',
    description: 'Throws a kunai.',
    variables: [{ __typename: 'AbilityVariable', name: 'Damage', values: [150, 225, 335] }],
  },
  imageUrl: null,
  iconUrl: null,
};

const items = [
  {
    __typename: 'Item',
    id: 'TFT18_BFSword',
    name: 'B.F. Sword',
    description: 'Attack Damage +15',
    components: [],
    effects: [{ __typename: 'ItemEffect', name: 'AD', value: 0.15 }],
    imageUrl: null,
    unique: false,
    trait: null,
  },
];

const traits = [
  {
    __typename: 'Trait',
    key: 'Inferno',
    name: 'Inferno',
    description: 'Burn enemies',
    breakpoints: [{
      __typename: 'TraitBreakpoint',
      count: 2,
      bonus: 'Burns enemies for 10% of damage dealt',
      variables: [],
    }],
  },
];

const augments = [
  {
    __typename: 'Augment',
    id: 'TFT9_Augment_CyberneticBulk3',
    name: 'Cybernetic Bulk III',
    description: 'Your team gains Health.',
    imageUrl: null,
  },
  {
    __typename: 'Augment',
    id: 'TFT18_UnknownBehaviorAugment',
    name: 'Unknown Behavior Augment',
    description: 'A behavioral augment the engine does not model yet.',
    imageUrl: null,
  },
];

const activeSetMock = {
  request: { query: GET_ACTIVE_SET },
  result: {
    data: {
      activeSet: {
        __typename: 'SetData',
        setId: 18,
        setName: 'Enchanted Wilds',
        status: 'active',
        champions: [champion],
        traits,
        items,
        augments,
      },
    },
  },
};

function renderSandbox(mocks = [activeSetMock]) {
  return render(
    <MockedProvider mocks={mocks}>
      <SandboxPage />
    </MockedProvider>,
  );
}

describe('SandboxPage', () => {
  beforeEach(() => {
    document.elementsFromPoint = (() => []) as typeof document.elementsFromPoint;
  });

  afterEach(() => {
    cleanup();
  });

  it('renders boards, palette and level controls from the active set', async () => {
    renderSandbox();

    expect(await screen.findByText(/Enchanted Wilds/)).toBeTruthy();
    expect(screen.getByTestId('palette-TFT18_Akali')).toBeTruthy();
    expect(screen.getAllByTestId('arena-board')).toHaveLength(2);
    expect(screen.getByLabelText('blue level')).toBeTruthy();
    expect(screen.getByLabelText('red level')).toBeTruthy();
    expect(screen.getByText('Predict outcome (128 seeded fights)').closest('button')).toBeDisabled();
  });

  it('flags unmodeled augments when selected', async () => {
    renderSandbox();
    await screen.findByText(/Enchanted Wilds/);

    const search = screen.getAllByPlaceholderText('Search augments…')[0];
    fireEvent.change(search, { target: { value: 'Unknown' } });
    fireEvent.click((await screen.findAllByText('Unknown Behavior Augment'))[0]);

    expect(screen.getByText('Augments (1/3)')).toBeTruthy();
    expect(screen.getByTitle('Not modeled — excluded from prediction')).toBeTruthy();
  });

  it('accepts a dragged champion and produces a prediction', async () => {
    renderSandbox();
    await screen.findByText(/Enchanted Wilds/);

    const blueBoard = screen.getAllByTestId('arena-board')[0];
    const cell = blueBoard.querySelector('[data-drop-id="cell-3-0"]');
    expect(cell).not.toBeNull();
    document.elementsFromPoint = (() => [cell as Element]) as typeof document.elementsFromPoint;

    fireEvent.pointerDown(screen.getByTestId('palette-TFT18_Akali'), {
      button: 0, clientX: 5, clientY: 5, pointerId: 1, pointerType: 'mouse',
    });
    fireEvent.pointerMove(window, { clientX: 80, clientY: 80, pointerId: 1, pointerType: 'mouse' });
    fireEvent.pointerUp(window, { clientX: 80, clientY: 80, pointerId: 1, pointerType: 'mouse' });

    await waitFor(() => {
      expect(screen.getByText('Blue board (you)').closest('div')?.textContent).toContain('1/8');
    });

    const predictButton = screen.getByText('Predict outcome (128 seeded fights)').closest('button')!;
    expect(predictButton).not.toBeDisabled();
    fireEvent.click(predictButton);

    expect(await screen.findByText('Prediction')).toBeTruthy();
    expect(screen.getByText('Blue wins (128)')).toBeTruthy();
    expect(screen.getByText(/Mechanics coverage:/)).toBeTruthy();
  }, 20000);

  it('shows a fallback when no active set is available', async () => {
    renderSandbox([{
      request: { query: GET_ACTIVE_SET },
      result: { data: { activeSet: null } },
    }]);

    expect(await screen.findByText(/Could not load the active set/)).toBeTruthy();
  });
});
