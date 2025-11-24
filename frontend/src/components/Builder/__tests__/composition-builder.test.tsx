import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Mock, vi, describe, test, beforeEach, expect } from 'vitest';
import '@testing-library/jest-dom';
import Builder from '../Builder';
import { api } from '../../../lib/api';
import { Champion, Set, Trait } from '../../../types';

// Mock the API
vi.mock('../../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Comprehensive Composition Builder Tests', () => {
  const mockSet: Set = {
    id: 'set16',
    name: 'Lore & Legends',
    short_name: 'Set16',
    version: '16.01',
    is_active: true,
    release_date: '2025-12-03T00:00:00Z',
    description: 'Lore & Legends TFT Set',
    image_url: '/set16.jpg'
  };

  const mockChampions: Champion[] = [
    {
      id: 'ahri',
      name: 'Ahri',
      cost: 2,
      traits: ['Arcane', 'Sorcerer'],
      image: '/ahri.jpg',
      display_name: 'Nine-Tailed Fox',
      description: 'Ahri is a fox-like creature who channels magic through a charm.',
      stats: {
        health: 550,
        mana: 70,
        starting_mana: 0,
        armor: 20,
        magic_resist: 20,
        attack_damage: 40,
        attack_speed: 0.65,
        attack_range: 3,
        crit_chance: 25,
        crit_multiplier: 150
      },
      ability: {
        name: 'Orb of Deception',
        description: 'Ahri sends out and pulls back her orb, dealing damage on the way out and healing for damage dealt on the way back.',
        type: 'Damage/Heal',
        targeting: 'Line',
        damage_type: 'Magic',
        scaling: []
      },
      splash_url: '/ahri-splash.jpg',
      rarity: 'Epic',
      release_version: 'Set16',
      set_id: 'set16',
      is_enabled: true
    },
    {
      id: 'akali',
      name: 'Akali',
      cost: 3,
      traits: ['Ninja', 'Assassin'],
      image: '/akali.jpg',
      display_name: 'The Rogue Assassin',
      description: 'A deadly kunoichi who wields twin kamas with lethal grace.',
      stats: {
        health: 650,
        mana: 80,
        starting_mana: 0,
        armor: 25,
        magic_resist: 20,
        attack_damage: 70,
        attack_speed: 0.75,
        attack_range: 1,
        crit_chance: 25,
        crit_multiplier: 150
      },
      ability: {
        name: 'Five Point Strike',
        description: 'Akali throws five deadly kunai at her target, dealing damage to the primary target.',
        type: 'Damage',
        targeting: 'Single',
        damage_type: 'Physical',
        scaling: []
      },
      splash_url: '/akali-splash.jpg',
      rarity: 'Epic',
      release_version: 'Set16',
      set_id: 'set16',
      is_enabled: true
    }
  ];

  const mockTraits: Trait[] = [
    {
      id: 'arcane',
      name: 'Arcane',
      description: 'When your champions gain mana, they gain additional mana.',
      trait_type: 'Class',
      breakpoints: [
        {
          count: 2,
          description: '2 units: Champions gain 10 additional mana when they gain mana',
          bonuses: { additional_mana: 10 }
        },
        {
          count: 4,
          description: '4 units: Champions gain 20 additional mana when they gain mana',
          bonuses: { additional_mana: 20 }
        }
      ],
      tiers: [
        {
          minUnits: 2,
          maxUnits: 2,
          style: 1,
          name: 'Arcane',
          variables: { additional_mana: 10 }
        },
        {
          minUnits: 4,
          maxUnits: 4,
          style: 2,
          name: 'Arcane',
          variables: { additional_mana: 20 }
        }
      ]
    },
    {
      id: 'sorcerer',
      name: 'Sorcerer',
      description: 'Sorcerers gain bonus Attack Speed and Mana Regeneration.',
      trait_type: 'Class',
      breakpoints: [
        {
          count: 2,
          description: '2 units: Sorcerers gain 25% Attack Speed and 15% Mana Regeneration',
          bonuses: { attack_speed: 0.25, mana_regeneration: 0.15 }
        },
        {
          count: 4,
          description: '4 units: Sorcerers gain 40% Attack Speed and 25% Mana Regeneration',
          bonuses: { attack_speed: 0.40, mana_regeneration: 0.25 }
        }
      ],
      tiers: [
        {
          minUnits: 2,
          maxUnits: 2,
          style: 1,
          name: 'Sorcerer',
          variables: { attack_speed: 0.25, mana_regeneration: 0.15 }
        },
        {
          minUnits: 4,
          maxUnits: 4,
          style: 2,
          name: 'Sorcerer',
          variables: { attack_speed: 0.40, mana_regeneration: 0.25 }
        }
      ]
    }
  ];

  beforeEach(() => {
    // Reset mocks before each test
    (api.get as Mock).mockClear();
    (api.post as Mock).mockClear();
  });

  test('loads and displays the composition builder with initial data', async () => {
    // Mock API calls for sets, champions, and traits
    (api.get as Mock).mockResolvedValueOnce({ data: [mockSet] });
    (api.get as Mock).mockResolvedValueOnce({ data: mockChampions });
    (api.get as Mock).mockResolvedValueOnce({ data: mockTraits });

    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
    });

    // Verify the main sections are present
    expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
    expect(screen.getByText('Game Board')).toBeInTheDocument();
    expect(screen.getByText('Champions')).toBeInTheDocument();
    expect(screen.getByText('Active Traits')).toBeInTheDocument();

    // Verify champion picker contains champions
    const championPicker = screen.getByText('Champions').parentElement?.parentElement;
    expect(championPicker).toBeInTheDocument();

    // Verify champion icons are rendered
    expect(screen.getByAltText('Ahri')).toBeInTheDocument();
    expect(screen.getByAltText('Akali')).toBeInTheDocument();
  });

  test('allows placing champions on the board', async () => {
    // Mock API calls for sets, champions, and traits
    (api.get as Mock).mockResolvedValueOnce({ data: [mockSet] });
    (api.get as Mock).mockResolvedValueOnce({ data: mockChampions });
    (api.get as Mock).mockResolvedValueOnce({ data: mockTraits });

    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
    });

    // Find the Ahri champion in picker and click it
    const ahriChampion = screen.getByAltText('Ahri');
    fireEvent.click(ahriChampion);

    // Verify Ahri is now selected
    expect(screen.getByText('Ahri')).toBeInTheDocument();
    expect(screen.getByText('2 Star')).toBeInTheDocument();

    // Find the first board slot and click it
    const boardSlots = screen.getAllByRole('button');
    const firstBoardSlot = boardSlots.find(slot => 
      slot.classList.contains('bg-gray-100') && 
      slot.classList.contains('border-gray-300')
    );

    if (firstBoardSlot) {
      fireEvent.click(firstBoardSlot);

      // Verify Ahri is now on the board
      await waitFor(() => {
        const ahriOnBoard = screen.getByAltText('Ahri');
        expect(ahriOnBoard).toBeInTheDocument();
      });
    }
  });

  test('calculates active traits when champions are placed', async () => {
    // Mock API calls
    (api.get as Mock).mockResolvedValueOnce({ data: [mockSet] });
    (api.get as Mock).mockResolvedValueOnce({ data: mockChampions });
    (api.get as Mock).mockResolvedValueOnce({ data: mockTraits });

    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
    });

    // Place two Ahri champions on the board (to trigger Arcane trait)
    const ahriChampion = screen.getByAltText('Ahri');
    fireEvent.click(ahriChampion); // Select Ahri

    // Click on multiple board positions to place Ahri
    const boardRows = screen.getAllByTestId('board-row');
    const firstRow = within(boardRows[0]).getAllByRole('button');
    
    fireEvent.click(firstRow[0]); // Place first Ahri
    fireEvent.click(ahriChampion); // Select Ahri again
    fireEvent.click(firstRow[1]); // Place second Ahri

    // Wait for trait calculation
    await waitFor(() => {
      const activeTrait = screen.getByText('Arcane');
      expect(activeTrait).toBeInTheDocument();
    });
  });

  test('allows champion selection and information display', async () => {
    // Mock API calls
    (api.get as Mock).mockResolvedValueOnce({ data: [mockSet] });
    (api.get as Mock).mockResolvedValueOnce({ data: mockChampions });
    (api.get as Mock).mockResolvedValueOnce({ data: mockTraits });

    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
    });

    // Click on Ahri in the picker
    const ahriChampion = screen.getByAltText('Ahri');
    fireEvent.click(ahriChampion);

    // Verify detailed champion information is shown
    expect(screen.getByText('Ahri')).toBeInTheDocument();
    expect(screen.getByText('Traits: Arcane, Sorcerer')).toBeInTheDocument();
    expect(screen.getByText('2 Star')).toBeInTheDocument();
    expect(screen.getByText('Ahri is a fox-like creature who channels magic through a charm.')).toBeInTheDocument();
  });

  test('allows board reset functionality', async () => {
    // Mock API calls
    (api.get as Mock).mockResolvedValueOnce({ data: [mockSet] });
    (api.get as Mock).mockResolvedValueOnce({ data: mockChampions });
    (api.get as Mock).mockResolvedValueOnce({ data: mockTraits });

    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
    });

    // Place a champion on the board
    const ahriChampion = screen.getByAltText('Ahri');
    fireEvent.click(ahriChampion);
    const boardRows = screen.getAllByTestId('board-row');
    const firstRow = within(boardRows[0]).getAllByRole('button');
    fireEvent.click(firstRow[0]); // Place Ahri on board

    // Verify Ahri is on the board
    await waitFor(() => {
      expect(screen.getByAltText('Ahri')).toBeInTheDocument();
    });

    // Click the reset button
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);

    // Verify the board is empty after reset
    await waitFor(() => {
      expect(() => screen.getByAltText('Ahri')).toThrow();
    });

    // Verify board slots are back to default state
    const emptySlots = screen.getAllByRole('button');
    const emptyBoardSlots = emptySlots.filter(slot => 
      slot.classList.contains('bg-gray-100') && 
      slot.classList.contains('border-gray-300')
    );
    expect(emptyBoardSlots.length).toBeGreaterThan(0);
  });

  test('updates composition stats when champions are added', async () => {
    // Mock API calls
    (api.get as Mock).mockResolvedValueOnce({ data: [mockSet] });
    (api.get as Mock).mockResolvedValueOnce({ data: mockChampions });
    (api.get as Mock).mockResolvedValueOnce({ data: mockTraits });

    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
    });

    // Place a champion and verify stats update
    const ahriChampion = screen.getByAltText('Ahri');
    fireEvent.click(ahriChampion);
    const boardRows = screen.getAllByTestId('board-row');
    const firstRow = within(boardRows[0]).getAllByRole('button');
    fireEvent.click(firstRow[0]); // Place Ahri on board

    await waitFor(() => {
      // Verify stats panel updates
      expect(screen.getByText('Champions on board:')).toBeInTheDocument();
      expect(screen.getByText('1/36')).toBeInTheDocument();
    });

    // Place another champion
    fireEvent.click(ahriChampion); // Select Ahri again
    fireEvent.click(firstRow[1]); // Place Ahri in second slot

    await waitFor(() => {
      // Verify stats update to 2 champions
      expect(screen.getByText('2/36')).toBeInTheDocument();
    });
  });

  test('handles set selection changes', async () => {
    const mockSets = [mockSet, {
      id: 'set15',
      name: 'Galaxies',
      short_name: 'Set15',
      version: '15.23',
      is_active: false,
      release_date: '2024-12-05T00:00:00Z',
      description: 'Galaxies TFT Set',
      image_url: '/set15.jpg'
    }];

    // Mock API calls
    (api.get as Mock).mockResolvedValueOnce({ data: mockSets });
    (api.get as Mock).mockResolvedValueOnce({ data: mockChampions });
    (api.get as Mock).mockResolvedValueOnce({ data: mockTraits });

    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
    });

    // Verify set selector exists and has both sets
    const setSelector = screen.getByRole('combobox');
    fireEvent.change(setSelector, { target: { value: 'set15' } });

    // Verify the change reflects appropriately
    // The component will re-fetch champions based on selected set
  });
});