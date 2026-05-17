import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { CompositionModel } from './Composition';

describe('CompositionModel', () => {
  beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tft_bible_test';
    try {
      await mongoose.connect(MONGO_URI);
    } catch {
      console.warn('MongoDB not available, skipping model tests');
    }
  });

  afterAll(async () => {
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch {}
  });

  it('should create and retrieve a composition', async () => {
    const doc = await CompositionModel.create({
      id: 'test-comp',
      title: 'Test Comp',
      description: 'A test composition',
      setId: 16,
      championIds: ['TFT16_Ahri', 'TFT16_Jinx'],
      traitBonuses: ['Arcane: 2'],
      augmentRecommendations: ['backfoot'],
      difficulty: 'Intermediate',
      region: 'Runeterra',
    });
    expect(doc.id).toBe('test-comp');
    expect(doc.title).toBe('Test Comp');
    expect(doc.createdAt).toBeDefined();
  });

  it('should save units with position, starLevel, and items', async () => {
    const doc = await CompositionModel.create({
      id: 'comp-with-units',
      title: 'Comp With Units',
      description: 'Has full board state',
      setId: 16,
      championIds: ['TFT16_Ahri'],
      units: [
        { championId: 'TFT16_Ahri', position: { row: 2, col: 3 }, starLevel: 2, items: ['TFT16_BFSword'] },
      ],
      traitBonuses: [],
      augmentRecommendations: [],
      difficulty: 'Beginner',
      region: 'Runeterra',
    });
    expect(doc.units).toHaveLength(1);
    expect(doc.units![0].position.row).toBe(2);
    expect(doc.units![0].starLevel).toBe(2);
  });

  it('should enforce unique id', async () => {
    await CompositionModel.create({
      id: 'dup-id', title: 'First', description: '', setId: 16,
      championIds: [], traitBonuses: [], augmentRecommendations: [],
      difficulty: '', region: '',
    });
    await expect(CompositionModel.create({
      id: 'dup-id', title: 'Second', description: '', setId: 16,
      championIds: [], traitBonuses: [], augmentRecommendations: [],
      difficulty: '', region: '',
    })).rejects.toThrow();
  });
});
