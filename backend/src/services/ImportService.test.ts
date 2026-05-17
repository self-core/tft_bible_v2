import { describe, it, expect } from 'vitest';
import { ImportService } from './ImportService';

describe('ImportService', () => {
  it('should be constructable', () => {
    const service = new ImportService();
    expect(service).toBeDefined();
  });
});
