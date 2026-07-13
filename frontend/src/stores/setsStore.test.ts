import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSetsStore } from './setsStore';

vi.mock('../lib/api', () => ({
  api: {
    getSets: vi.fn(),
  },
}));

const mockSets = [
  {
    setId: 16,
    setName: 'Set 16',
    status: 'archived',
    champions: [],
    traits: [],
    items: [],
    augments: [],
  },
  {
    setId: 17,
    setName: 'Set 17',
    status: 'active',
    champions: [],
    traits: [],
    items: [],
    augments: [],
  },
  {
    setId: 18,
    setName: 'Set 18',
    status: 'upcoming',
    champions: [],
    traits: [],
    items: [],
    augments: [],
  },
];

beforeEach(() => {
  useSetsStore.setState({
    sets: [],
    activeSetId: null,
    loading: false,
    error: null,
  });
  vi.clearAllMocks();
});

describe('fetchSets', () => {
  it('should set activeSetId to the active set', async () => {
    const { api } = await import('../lib/api');
    (api.getSets as any).mockResolvedValue({ data: { sets: mockSets } });

    const { result } = renderHook(() => useSetsStore());

    await act(async () => {
      await result.current.fetchSets();
    });

    expect(result.current.activeSetId).toBe(17);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fall back to first set if no active set', async () => {
    const { api } = await import('../lib/api');
    const setsNoActive = [
      { ...mockSets[0], status: 'archived' },
      { ...mockSets[2], status: 'upcoming' },
    ];
    (api.getSets as any).mockResolvedValue({ data: { sets: setsNoActive } });

    const { result } = renderHook(() => useSetsStore());

    await act(async () => {
      await result.current.fetchSets();
    });

    expect(result.current.activeSetId).toBe(16);
  });

  it('should set error on failure', async () => {
    const { api } = await import('../lib/api');
    (api.getSets as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSetsStore());

    await act(async () => {
      await result.current.fetchSets();
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });
});

describe('isSetArchived', () => {
  it('should return true for archived sets', () => {
    const { result } = renderHook(() => useSetsStore());

    act(() => {
      useSetsStore.setState({ sets: mockSets as any });
    });

    expect(result.current.isSetArchived(16)).toBe(true);
    expect(result.current.isSetArchived(17)).toBe(false);
    expect(result.current.isSetArchived(18)).toBe(false);
  });

  it('should return false for unknown set', () => {
    const { result } = renderHook(() => useSetsStore());

    act(() => {
      useSetsStore.setState({ sets: mockSets as any });
    });

    expect(result.current.isSetArchived(999)).toBe(false);
  });
});

describe('getActiveSet', () => {
  it('should return the active set', () => {
    const { result } = renderHook(() => useSetsStore());

    act(() => {
      useSetsStore.setState({ sets: mockSets as any, activeSetId: 17 });
    });

    expect(result.current.getActiveSet()?.setId).toBe(17);
  });

  it('should return undefined if no active set', () => {
    const { result } = renderHook(() => useSetsStore());

    act(() => {
      useSetsStore.setState({ sets: mockSets as any, activeSetId: null });
    });

    expect(result.current.getActiveSet()).toBeUndefined();
  });

  it('should return undefined if activeSetId does not match any set', () => {
    const { result } = renderHook(() => useSetsStore());

    act(() => {
      useSetsStore.setState({ sets: mockSets as any, activeSetId: 999 });
    });

    expect(result.current.getActiveSet()).toBeUndefined();
  });
});
