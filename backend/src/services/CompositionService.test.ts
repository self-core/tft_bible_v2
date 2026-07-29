import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { CompositionService } from './CompositionService';

describe('CompositionService', () => {
  let service: CompositionService;
  let isConnected = false;

  beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tft_bible_test';
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      isConnected = true;
    } catch {
      console.warn('MongoDB not available, skipping service tests');
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

  beforeEach(async () => {
    service = new CompositionService();
    if (isConnected) {
      try {
        await mongoose.connection.db?.dropCollection('compositions');
      } catch {}
    }
  });

  it('should create and retrieve by id', async () => {
    if (!isConnected) return;
    const created = await service.create({
      title: 'My Comp',
      description: 'Desc',
      setId: 16,
      championIds: ['TFT16_Ahri'],
      traitBonuses: ['Arcane: 2'],
      augmentRecommendations: [],
      difficulty: 'Beginner',
      region: 'Runeterra',
    });
    expect(created.id).toMatch(/^my-comp-/);
    expect(created.title).toBe('My Comp');

    const found = await service.getById(created.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe('My Comp');
  });

  it('should return null for non-existent id', async () => {
    if (!isConnected) return;
    const found = await service.getById('nonexistent');
    expect(found).toBeNull();
  });

  it('should return all compositions', async () => {
    if (!isConnected) return;
    await service.create({ title: 'Comp A', description: 'x', setId: 16, championIds: [], traitBonuses: [], augmentRecommendations: [], difficulty: 'x', region: 'x' });
    await service.create({ title: 'Comp B', description: 'x', setId: 16, championIds: [], traitBonuses: [], augmentRecommendations: [], difficulty: 'x', region: 'x' });
    const all = await service.getAll();
    expect(all).toHaveLength(2);
  });

  it('should filter by setId', async () => {
    if (!isConnected) return;
    await service.create({ title: 'Set16 Comp', description: 'x', setId: 16, championIds: [], traitBonuses: [], augmentRecommendations: [], difficulty: 'x', region: 'x' });
    await service.create({ title: 'Set17 Comp', description: 'x', setId: 17, championIds: [], traitBonuses: [], augmentRecommendations: [], difficulty: 'x', region: 'x' });
    const set16 = await service.getBySet(16);
    expect(set16).toHaveLength(1);
    expect(set16[0].title).toBe('Set16 Comp');
  });

  it('should update a composition', async () => {
    if (!isConnected) return;
    const created = await service.create({ title: 'Original', description: 'x', setId: 16, championIds: [], traitBonuses: [], augmentRecommendations: [], difficulty: 'x', region: 'x' });
    const updated = await service.update(created.id, { title: 'Updated' });
    expect(updated!.title).toBe('Updated');
  });

  it('should delete a composition', async () => {
    if (!isConnected) return;
    const created = await service.create({ title: 'To Delete', description: 'x', setId: 16, championIds: [], traitBonuses: [], augmentRecommendations: [], difficulty: 'x', region: 'x' });
    const deleted = await service.delete(created.id);
    expect(deleted).toBe(true);
    const found = await service.getById(created.id);
    expect(found).toBeNull();
  });

  it('should delete return false for non-existent', async () => {
    if (!isConnected) return;
    const deleted = await service.delete('nonexistent');
    expect(deleted).toBe(false);
  });

  it('should search by title', async () => {
    if (!isConnected) return;
    await service.create({ title: 'Hyper Carry', description: 'x', setId: 16, championIds: [], traitBonuses: ['Gunner: 4'], augmentRecommendations: [], difficulty: 'x', region: 'x' });
    await service.create({ title: 'Sorcerer Control', description: 'x', setId: 16, championIds: [], traitBonuses: ['Sorcerer: 4'], augmentRecommendations: [], difficulty: 'x', region: 'x' });
    const results = await service.search('hyper');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Hyper Carry');
  });

  it('should search by description and traitBonuses', async () => {
    if (!isConnected) return;
    await service.create({ title: 'A', description: 'arcane power', setId: 16, championIds: [], traitBonuses: ['Arcane: 2'], augmentRecommendations: [], difficulty: 'x', region: 'x' });
    const byDesc = await service.search('arcane');
    expect(byDesc.length).toBeGreaterThanOrEqual(1);
  });

  it('should create composition with units', async () => {
    if (!isConnected) return;
    const created = await service.create({
      title: 'Precise Comp',
      description: 'x',
      setId: 16,
      championIds: ['TFT16_Ahri'],
      units: [{ championId: 'TFT16_Ahri', position: { row: 2, col: 3 }, starLevel: 2, items: ['TFT16_BFSword'] }],
      traitBonuses: [],
      augmentRecommendations: [],
      difficulty: 'x',
      region: 'x',
    });
    expect(created.units).toHaveLength(1);
    expect(created.units![0].starLevel).toBe(2);
  });
});
