import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { CompositionModel } from './Composition';

describe('CompositionModel', () => {
  let isConnected = false;

  beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tft_bible_test';
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      isConnected = true;
    } catch {
      console.warn('MongoDB not available, skipping model tests');
    }
  });

  afterAll(async () => {
    if (isConnected) {
      try {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
      } catch {}
    }
  });

  it('should create and retrieve a composition', async () => {
    if (!isConnected) return;
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
    if (!isConnected) return;
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
    if (!isConnected) return;
    const base = { description: 'x', difficulty: 'x', region: 'x', setId: 16, championIds: [], traitBonuses: [], augmentRecommendations: [] };
    await CompositionModel.create({ id: 'dup-id', title: 'First', ...base });
    await expect(CompositionModel.create({ id: 'dup-id', title: 'Second', ...base })).rejects.toThrow();
  });
});
