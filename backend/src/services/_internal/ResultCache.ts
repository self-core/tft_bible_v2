import { injectable } from 'tsyringe';
import { ISetData } from '../../interfaces';

@injectable()
export class ResultCache {
  private cache = new Map<number, ISetData>();

  get(setId: number): ISetData | null {
    return this.cache.get(setId) ?? null;
  }

  set(setId: number, data: ISetData): void {
    this.cache.set(setId, data);
  }

  clear(setId: number): void {
    this.cache.delete(setId);
  }

  clearAll(): void {
    this.cache.clear();
  }
}
