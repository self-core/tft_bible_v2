import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportService } from './ImportService';
import { Repository } from './_internal/Repository';
import { PathResolver } from './_internal/PathResolver';

vi.mock('./_internal/FileParser', () => ({
  FileParser: {
    readJsonFile: vi.fn(),
    parseChampionFile: vi.fn(),
    parseTraitFile: vi.fn(),
    parseItemFile: vi.fn(),
  },
}));

vi.mock('./_internal/DataTransformer', () => ({
  DataTransformer: {
    buildChampionPortraitUrl: vi.fn().mockReturnValue('http://cdn/portrait.png'),
    buildSplashUrl: vi.fn().mockReturnValue('http://cdn/splash.jpg'),
    parseTrait: vi.fn().mockImplementation((t: any) => ({ key: t.key, name: t.name })),
  },
}));

const mockRepository = {
  saveChampions: vi.fn().mockResolvedValue(undefined),
  saveTraits: vi.fn().mockResolvedValue(undefined),
  saveItems: vi.fn().mockResolvedValue(undefined),
  saveSetData: vi.fn().mockResolvedValue(undefined),
};

const mockPathResolver = {
  findDragontailDir: vi.fn(),
  getChampionSetPath: vi.fn().mockReturnValue('/dragontail/champions-set.json'),
  getChampionPath: vi.fn().mockReturnValue('/dragontail/champions.json'),
  getTraitSetPath: vi.fn().mockReturnValue('/dragontail/traits-set.json'),
  getTraitPath: vi.fn().mockReturnValue('/dragontail/traits.json'),
  getItemSetPath: vi.fn().mockReturnValue('/dragontail/items-set.json'),
  getItemPath: vi.fn().mockReturnValue('/dragontail/items.json'),
};

describe('ImportService.importSet', () => {
  let service: ImportService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ImportService(mockRepository as unknown as Repository, mockPathResolver as unknown as PathResolver);
  });

  it('returns champion/trait/item counts when import succeeds', async () => {
    const { FileParser } = await import('./_internal/FileParser');
    mockPathResolver.findDragontailDir.mockReturnValue('/dragontail');
    (FileParser.readJsonFile as ReturnType<typeof vi.fn>)
      .mockReturnValue({ data: {} });
    (FileParser.parseChampionFile as ReturnType<typeof vi.fn>)
      .mockReturnValue([{ name: 'Ahri', cost: 4, traits: ['Arcane'], stats: {}, ability: {} }]);
    (FileParser.parseTraitFile as ReturnType<typeof vi.fn>)
      .mockReturnValue([{ key: 'arcane', name: 'Arcane' }, { key: 'ranger', name: 'Ranger' }, { key: 'warrior', name: 'Warrior' }]);
    (FileParser.parseItemFile as ReturnType<typeof vi.fn>)
      .mockReturnValue([{ id: 'item1', name: 'Rabadon', description: 'AP', components: [] }]);

    const result = await service.importSet(16);

    expect(result).toEqual({ champions: 1, traits: 3, items: 1 });
    expect(mockRepository.saveChampions).toHaveBeenCalledTimes(1);
    expect(mockRepository.saveTraits).toHaveBeenCalledTimes(1);
    expect(mockRepository.saveItems).toHaveBeenCalledTimes(1);
    expect(mockRepository.saveSetData).toHaveBeenCalledWith(
      16,
      'Set 16',
      expect.arrayContaining([expect.stringMatching(/TFT16/)]),
      expect.arrayContaining(['arcane', 'ranger', 'warrior']),
      expect.arrayContaining(['item1']),
      []
    );
  });

  it('throws when dragontail directory not found', async () => {
    mockPathResolver.findDragontailDir.mockReturnValue(null);

    await expect(service.importSet(16)).rejects.toThrow('No dragontail data directory found for set 16');
    expect(mockRepository.saveChampions).not.toHaveBeenCalled();
  });

  it('throws when dragontail data files are missing', async () => {
    const { FileParser } = await import('./_internal/FileParser');
    mockPathResolver.findDragontailDir.mockReturnValue('/dragontail');
    (FileParser.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue(null);

    await expect(service.importSet(16)).rejects.toThrow('One or more dragontail data files not found for set 16');
    expect(mockRepository.saveChampions).not.toHaveBeenCalled();
  });
});
