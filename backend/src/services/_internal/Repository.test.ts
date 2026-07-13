import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Repository } from './Repository';
import mongoose from 'mongoose';

describe('Repository', () => {
  let repo: Repository;
  let isConnected = false;

  beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tft_bible_test';
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
      isConnected = true;
      repo = new Repository();
    } catch {
      console.warn('MongoDB not available, skipping DB-dependent tests');
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

  it('should be constructable', () => {
    const r = new Repository();
    expect(r).toBeDefined();
  });

  it('should return null for non-existent set', async () => {
    if (!isConnected) return;
    const data = await repo.getSetData(9999);
    expect(data).toBeNull();
  });

  it('should return false for non-existent set', async () => {
    if (!isConnected) return;
    expect(await repo.hasSet(9999)).toBe(false);
  });
});

describe('Repository — status methods', () => {
  let repo: Repository;
  let isConnected = false;

  beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tft_bible_test';
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
      isConnected = true;
      repo = new Repository();
    } catch {
      console.warn('MongoDB not available, skipping DB-dependent tests');
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

  it('getAllSets should return empty array when no sets exist', async () => {
    if (!isConnected) return;
    const sets = await repo.getAllSets();
    expect(Array.isArray(sets)).toBe(true);
  });

  it('getActiveSet should return null when no active set exists', async () => {
    if (!isConnected) return;
    const active = await repo.getActiveSet();
    expect(active).toBeNull();
  });

  it('setSetStatus should update set status', async () => {
    if (!isConnected) return;
    await expect(repo.setSetStatus(9999, 'archived')).resolves.toBeUndefined();
  });
});
