import { describe, it, expect, vi } from 'vitest';
import { SetDataService } from './SetDataService';
import { Repository } from './_internal/Repository';
import { ImportService } from './ImportService';
import { ResultCache } from './_internal/ResultCache';

vi.mock('./_internal/Repository', () => ({
  Repository: vi.fn().mockImplementation(() => ({
    getSetData: vi.fn().mockRejectedValue(new Error('DB not available')),
    hasSet: vi.fn().mockResolvedValue(false),
  })),
}));

vi.mock('./ImportService', () => ({
  ImportService: vi.fn().mockImplementation(() => ({
    importSet: vi.fn().mockRejectedValue(new Error('No dragontail files')),
  })),
}));

describe('SetDataService', () => {
  it('should be constructable', () => {
    const service = new SetDataService(new Repository(), new (ImportService as any)(), new ResultCache());
    expect(service).toBeDefined();
  });

  it('should return embedded fallback data when no DB or files available', async () => {
    const service = new SetDataService(new Repository(), new (ImportService as any)(), new ResultCache());
    await service.initialize();
    const data = await service.getSetData(16);
    expect(data).not.toBeNull();
    expect(data.champions.length).toBeGreaterThan(0);
    expect(data.traits.length).toBeGreaterThan(0);
    expect(data.items.length).toBeGreaterThan(0);
  });

  it('should cache results', async () => {
    const service = new SetDataService(new Repository(), new (ImportService as any)(), new ResultCache());
    await service.initialize();
    const first = await service.getSetData(16);
    const second = await service.getSetData(16);
    expect(first).toBe(second);
  });
});
