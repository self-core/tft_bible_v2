import { describe, test, expect, beforeEach, vi } from 'vitest';
import { compositionsApi, healthApi, setsApi, Champion, Composition, CompositionSummary } from '../../../lib/api';
import axios from 'axios';

// Mock the interceptors issue by mocking the API differently
vi.mock('../../../lib/api', async () => {
  const actual = await vi.importActual('../../../lib/api');
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }
  };
});

// Mock axios to simulate API calls
vi.mock('axios');

describe('API Integration Tests with Mock Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('health check endpoint returns status', async () => {
    const mockResponse = { status: 'ok' };
    (axios.get as vi.MockedFunction<typeof axios.get>).mockResolvedValue({ data: mockResponse });

    const result = await healthApi.check();
    expect(result.data).toEqual(mockResponse);
    expect(axios.get).toHaveBeenCalledWith('/api/v1/health');
  });

  test('gets all compositions from API', async () => {
    const mockCompositions: CompositionSummary[] = [
      {
        id: '1',
        name: 'Test Composition',
        category: 'Mage',
        tier: 'S',
        difficulty: 3,
        winrate: 0.62,
        views: 1245,
        upvotes: 120,
        created_at: '2025-11-19T13:06:19.478128'
      }
    ];

    const mockResponse = {
      data: mockCompositions,
      total: 1,
      page: 1,
      per_page: 10,
      total_pages: 1
    };

    (axios.get as vi.MockedFunction<typeof axios.get>).mockResolvedValue({ data: mockResponse });

    const result = await compositionsApi.getCompositions();
    expect(result.data).toEqual(mockResponse);
  });

  test('gets composition by ID', async () => {
    const mockComposition: Composition = {
      id: '1',
      set_id: 'set16',
      name: 'Test Composition',
      description: 'A test composition',
      category: 'Mage',
      tags: ['test', 'sample'],
      champions: [],
      augments: { preferred: [], acceptable: [], avoid: [] },
      meta: {
        tier: 'S',
        difficulty: 3,
        cost: 'Medium',
        patch: '16.01',
        playstyle: 'Aggressive',
        winrate: 0.62,
        avg_placement: 3.0,
        playrate: 0.15,
        contest_rate: 0.2
      },
      votes: { upvotes: 120, downvotes: 10 },
      views: 1245,
      favorites: 15,
      comments: [],
      is_public: true,
      is_verified: false,
      is_featured: false,
      created_at: '2025-11-19T13:06:19.478128',
      updated_at: '2025-11-19T13:06:19.478128'
    };

    (axios.get as vi.MockedFunction<typeof axios.get>).mockResolvedValue({ data: mockComposition });

    const result = await compositionsApi.getCompositionById('1');
    expect(result.data).toEqual(mockComposition);
  });

  test('gets all sets from API', async () => {
    const mockSets = [
      {
        id: 'set16',
        name: 'Lore & Legends',
        short_name: 'Set16',
        version: '16.01',
        is_active: true,
        release_date: '2025-12-03T00:00:00Z',
        description: 'Lore & Legends TFT Set',
        image_url: '/set16.jpg'
      }
    ];

    (axios.get as vi.MockedFunction<typeof axios.get>).mockResolvedValue({ data: mockSets });

    const result = await setsApi.getSets();
    expect(result.data).toEqual(mockSets);
  });

  test('gets active set from API', async () => {
    const mockSet = {
      id: 'set16',
      name: 'Lore & Legends',
      short_name: 'Set16',
      version: '16.01',
      is_active: true,
      release_date: '2025-12-03T00:00:00Z',
      description: 'Lore & Legends TFT Set',
      image_url: '/set16.jpg'
    };

    (axios.get as vi.MockedFunction<typeof axios.get>).mockResolvedValue({ data: mockSet });

    const result = await setsApi.getActiveSet();
    expect(result.data).toEqual(mockSet);
  });

  test('handles API errors gracefully', async () => {
    const mockError = new Error('Network Error');
    (axios.get as vi.MockedFunction<typeof axios.get>).mockRejectedValue(mockError);

    await expect(healthApi.check()).rejects.toThrow('Network Error');
  });

  test('creates a new composition', async () => {
    const newCompositionData = {
      name: 'New Composition',
      description: 'A new test composition',
      category: 'Mage',
      champions: [],
      meta: {
        tier: 'A',
        difficulty: 2,
        cost: 'Budget',
        patch: '16.01',
        playstyle: 'Rush',
        winrate: 0.55,
        avg_placement: 3.5,
        playrate: 0.12,
        contest_rate: 0.15
      }
    };

    const createdComposition = {
      ...newCompositionData,
      id: 'new-id',
      set_id: 'set16',
      tags: [],
      augments: { preferred: [], acceptable: [], avoid: [] },
      votes: { upvotes: 0, downvotes: 0 },
      views: 0,
      favorites: 0,
      comments: [],
      is_public: true,
      is_verified: false,
      is_featured: false,
      created_at: '2025-11-20T00:00:00Z',
      updated_at: '2025-11-20T00:00:00Z'
    };

    (axios.post as vi.MockedFunction<typeof axios.post>).mockResolvedValue({ 
      data: { 
        success: true, 
        data: createdComposition,
        message: 'Composition created successfully'
      } 
    });

    const result = await compositionsApi.createComposition(newCompositionData);
    
    expect(axios.post).toHaveBeenCalledWith('/api/v1/compositions', newCompositionData);
    expect(result.data.success).toBe(true);
    expect(result.data.data).toEqual(createdComposition);
  });

  test('votes on a composition', async () => {
    const mockVoteResponse = {
      upvotes: 121,
      downvotes: 10
    };

    (axios.post as vi.MockedFunction<typeof axios.post>).mockResolvedValue({ 
      data: { 
        success: true, 
        data: mockVoteResponse,
        message: 'Vote recorded successfully'
      } 
    });

    const result = await compositionsApi.voteComposition('1', 'up');
    
    expect(axios.post).toHaveBeenCalledWith('/api/v1/compositions/1/vote', { vote_type: 'up' });
    expect(result.data.success).toBe(true);
    expect(result.data.data).toEqual(mockVoteResponse);
  });
});