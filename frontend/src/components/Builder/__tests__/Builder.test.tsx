import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Mock, vi, describe, test, beforeEach, expect } from 'vitest';
import { expect as jestExpect } from 'vitest';
import '@testing-library/jest-dom';
import Builder from '../Builder';
import { api } from '../../../lib/api';

// Mock the API
vi.mock('../../../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Builder Component', () => {
  beforeEach(() => {
    (api.get as Mock).mockResolvedValue({
      data: [],
    });
  });

  test('renders the builder component with loading state', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders the builder component with data', async () => {
    (api.get as Mock).mockResolvedValueOnce({
      data: [
        { id: 'set1', name: 'Lore & Legends', version: '15.1', release_date: '2025-12-03T00:00:00Z', is_active: true }
      ],
    }).mockResolvedValueOnce({
      data: [
        {
          id: 'champ1',
          name: 'Kai\'Sa',
          display_name: 'Daughter of the Void',
          cost: 3,
          traits: ['Void', 'Marksman'],
          image: '/kaisa.jpg',
          stats: { health: 700, mana: 0, starting_mana: 0, armor: 25, magic_resist: 20, attack_damage: 60, attack_speed: 0.75, attack_range: 4, crit_chance: 25, crit_multiplier: 150 },
          ability: { name: 'Killer Instinct', description: 'Kai\'Sa\'s ability changes based on whether Attack Damage or Ability Power is higher', type: 'Passive', targeting: 'Self', damage_type: 'Mixed', scaling: [{ star_level: 1, damage: 150, additional_effects: {} }] },
          splash_url: '/kaisa-splash.jpg',
          rarity: 'Epic',
          release_version: 'Set16',
          set_id: 'set1',
          is_enabled: true
        }
      ],
    }).mockResolvedValueOnce({
      data: [
        { id: 'trait1', name: 'Void', description: 'Gain Mutations that only Void champions can use. Void champions gain Attack Speed.', trait_type: 'Region', breakpoints: [{ count: 2, description: '2 units: 1 Mutation, 8% Attack Speed', bonuses: { mutations: 1, attack_speed: 0.08 } }] }
      ],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
    });
  });

  test('renders the board with correct dimensions', async () => {
    // Mock the API to return empty data
    (api.get as Mock).mockResolvedValueOnce({
      data: [
        { id: 'set1', name: 'Lore & Legends', version: '15.1', release_date: '2025-12-03T00:00:00Z', is_active: true }
      ],
    }).mockResolvedValueOnce({
      data: [],
    }).mockResolvedValueOnce({
      data: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
    });

    // Check for the board structure (4 rows)
    const boardRows = screen.getAllByTestId('board-row');
    expect(boardRows).toHaveLength(4);
  });
});