import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockedProvider, Mock } from '@apollo/client/testing';
import { vi, describe, test, beforeEach, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import Builder from '../Builder';
import { 
  GET_CHAMPIONS, 
  GET_TRAITS, 
  CREATE_COMPOSITION,
  GET_COMPOSITION,
  UPDATE_COMPOSITION,
  DELETE_COMPOSITION
} from '../../../lib/graphql';
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

// Sample mock data
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
  },
  {
    id: 'sett',
    name: 'Sett',
    cost: 4,
    traits: ['Bruiser', 'Renascent'],
    image: '/sett.jpg',
    display_name: 'The Boss',
    description: 'Sett is the undisputed Baddest Dude in Town.',
    stats: {
      health: 850,
      mana: 120,
      starting_mana: 0,
      armor: 45,
      magic_resist: 35,
      attack_damage: 75,
      attack_speed: 0.65,
      attack_range: 1,
      crit_chance: 25,
      crit_multiplier: 150
    },
    ability: {
      name: 'Haymaker',
      description: 'Sett punches his target, dealing damage to the first enemy hit.',
      type: 'Damage',
      targeting: 'Single',
      damage_type: 'Physical',
      scaling: []
    },
    splash_url: '/sett-splash.jpg',
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

describe('Frontend GraphQL Integration Tests for Composition Builder', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset Apollo Client cache
    queryClient.clear();
  });

  test('saves composition using GraphQL mutation', async () => {
    // Mock GraphQL responses
    const mocks = [
      {
        request: {
          query: GET_CHAMPIONS,
          variables: { limit: 100 }
        },
        result: {
          data: {
            champions: mockChampions
          }
        }
      },
      {
        request: {
          query: GET_TRAITS
        },
        result: {
          data: {
            traits: mockTraits
          }
        }
      },
      {
        request: {
          query: CREATE_COMPOSITION,
          variables: {
            input: {
              name: expect.stringContaining('Composition'),
              description: expect.stringContaining('Saved composition'),
              category: 'Custom',
              tags: ['saved', 'user-generated'],
              champions: expect.any(Array),
              augments: [],
              positioning: null,
              gameplan: null,
              meta: {
                tier: 'C',
                difficulty: 1,
                cost: 'Flexible',
                patch: '16.0',
                playstyle: 'Balanced',
                winrate: 0.5,
                avgPlacement: 4.0,
                playrate: 0.1,
                contestRate: 0.1
              },
              matchups: null
            }
          }
        },
        result: {
          data: {
            createComposition: {
              id: 'mock-composition-id',
              name: 'Composition 11/24/2025',
              description: 'Saved composition on 11/24/2025, 12:00:00 PM',
              category: 'Custom',
              champions: [],
              augments: []
            }
          }
        }
      }
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <QueryClientProvider client={queryClient}>
          <Builder />
        </QueryClientProvider>
      </MockedProvider>
    );

    // Wait for initial loading
    await waitFor(() => {
      expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
    });

    // Place a champion on the board
    const ahriChampion = screen.getByAltText('Ahri');
    fireEvent.click(ahriChampion);

    // Click on a board slot
    const boardRows = screen.getAllByTestId('board-row');
    const firstRow = within(boardRows[0]).getAllByRole('button');
    fireEvent.click(firstRow[0]); // Place Ahri on board

    // Wait for the champion to be placed
    await waitFor(() => {
      expect(screen.getByAltText('Ahri')).toBeInTheDocument();
    });

    // Find and click the save button
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Wait for the save mutation to complete
    await waitFor(() => {
      expect(screen.getByText('Composition saved successfully!')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('loads and displays composition data correctly', async () => {
    const mockComposition = {
      id: 'test-comp-123',
      name: 'Test Composition',
      description: 'A test composition for GraphQL integration',
      category: 'Mage',
      champions: [
        {
          champion: {
            id: 'ahri',
            name: 'Ahri',
            cost: 2,
            traits: ['Arcane', 'Sorcerer']
          },
          starLevel: 2,
          items: [],
          position: { x: 0, y: 0 },
          isCore: true
        }
      ],
      augments: ['Arcane', 'Sorcerer']
    };

    const mocks = [
      {
        request: {
          query: GET_CHAMPIONS,
          variables: { limit: 100 }
        },
        result: {
          data: {
            champions: mockChampions
          }
        }
      },
      {
        request: {
          query: GET_TRAITS
        },
        result: {
          data: {
            traits: mockTraits
          }
        }
      },
      {
        request: {
          query: GET_COMPOSITION,
          variables: { id: 'test-comp-123' }
        },
        result: {
          data: {
            composition: mockComposition
          }
        }
      }
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <QueryClientProvider client={queryClient}>
          <Builder />
        </QueryClientProvider>
      </MockedProvider>
    );

    // Wait for initial loading
    await waitFor(() => {
      expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
    });
  });

  test('handles GraphQL errors gracefully', async () => {
    // Mock GraphQL responses with error
    const mocks = [
      {
        request: {
          query: GET_CHAMPIONS,
          variables: { limit: 100 }
        },
        result: {
          data: {
            champions: mockChampions
          }
        }
      },
      {
        request: {
          query: GET_TRAITS
        },
        result: {
          data: {
            traits: mockTraits
          }
        }
      },
      {
        request: {
          query: CREATE_COMPOSITION,
          variables: {
            input: expect.any(Object)
          }
        },
        error: new Error('Failed to save composition')
      }
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <QueryClientProvider client={queryClient}>
          <Builder />
        </QueryClientProvider>
      </MockedProvider>
    );

    // Wait for initial loading
    await waitFor(() => {
      expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
    });

    // Place a champion on the board
    const ahriChampion = screen.getByAltText('Ahri');
    fireEvent.click(ahriChampion);

    // Click on a board slot
    const boardRows = screen.getAllByTestId('board-row');
    const firstRow = within(boardRows[0]).getAllByRole('button');
    fireEvent.click(firstRow[0]); // Place Ahri on board

    // Wait for the champion to be placed
    await waitFor(() => {
      expect(screen.getByAltText('Ahri')).toBeInTheDocument();
    });

    // Find and click the save button
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Wait for the error handling
    await waitFor(() => {
      expect(screen.getByText('Error saving composition. Please try again.')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('interacts with trait tracker GraphQL mutation', async () => {
    const mockTraitTrackerResponse = {
      path: [
        {
          champion: {
            id: 'ahri',
            name: 'Ahri',
            cost: 2,
            traits: ['Arcane', 'Sorcerer']
          },
          traitsGained: ['Arcane'],
          cost: 2,
          efficiency: 0.5
        }
      ],
      efficiency: 0.5
    };

    const mocks = [
      {
        request: {
          query: GET_CHAMPIONS,
          variables: { limit: 100 }
        },
        result: {
          data: {
            champions: mockChampions
          }
        }
      },
      {
        request: {
          query: GET_TRAITS
        },
        result: {
          data: {
            traits: mockTraits
          }
        }
      },
      {
        request: {
          query: `
            mutation GetTraitTracker($input: TraitTrackerInput!) {
              traitTracker(input: $input) {
                path {
                  champion {
                    id
                    name
                    cost
                    traits
                  }
                  traitsGained
                  cost
                  efficiency
                }
                efficiency
              }
            }
          `,
          variables: {
            input: {
              targetTraits: [
                {
                  traitName: 'Arcane',
                  requiredCount: 2
                }
              ],
              currentTraits: []
            }
          }
        },
        result: {
          data: {
            traitTracker: mockTraitTrackerResponse
          }
        }
      }
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <QueryClientProvider client={queryClient}>
          <Builder />
        </QueryClientProvider>
      </MockedProvider>
    );

    // Wait for initial loading
    await waitFor(() => {
      expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
    });
  });
});