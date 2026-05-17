import * as path from 'path';
import * as fs from 'fs';

export class PathResolver {
  private static readonly DOCKER_BASE = path.join('/app', 'dragontail-data', '15.24.1', 'data', 'en_US');
  private static readonly LOCAL_BASE = path.join('C:', 'Users', 'puppets', 'Documents', 'League of Legends', 'dragontail-15.24.1', '15.24.1', 'data', 'en_US');

  findDragontailDir(): string | null {
    const candidates = [
      PathResolver.DOCKER_BASE,
      PathResolver.LOCAL_BASE,
      path.join(process.cwd(), 'dragontail-data', '15.24.1', 'data', 'en_US'),
    ];
    for (const dir of candidates) {
      if (fs.existsSync(dir)) return dir;
    }
    return null;
  }

  getChampionPath(baseDir: string): string {
    return path.join(baseDir, 'tft-champion.json');
  }

  getChampionSetPath(baseDir: string, setId: number): string {
    return path.join(baseDir, `tft-champion_Set${setId}.json`);
  }

  getTraitPath(baseDir: string): string {
    return path.join(baseDir, 'tft-trait.json');
  }

  getTraitSetPath(baseDir: string, setId: number): string {
    return path.join(baseDir, `tft-trait_Set${setId}.json`);
  }

  getItemPath(baseDir: string): string {
    return path.join(baseDir, 'tft-item.json');
  }

  getItemSetPath(baseDir: string, setId: number): string {
    return path.join(baseDir, `tft-item_Set${setId}.json`);
  }
}
