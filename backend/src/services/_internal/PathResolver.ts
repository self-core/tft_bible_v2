import * as path from 'path';
import * as fs from 'fs';
import { injectable } from 'tsyringe';

@injectable()
export class PathResolver {
  private static readonly VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
  private static readonly DRAGONTAIL_DIR_PATTERN = /^dragontail-/i;
  private static readonly MOUNT_CANDIDATES = [
    '/app/dragontail-data',
    path.join('C:', 'Users', 'puppets', 'Documents', 'League of Legends'),
    path.join(process.cwd(), 'dragontail-data'),
  ];

  findDragontailDir(): string | null {
    for (const mount of PathResolver.MOUNT_CANDIDATES) {
      if (!fs.existsSync(mount)) continue;
      let dataDir = this.findLatestVersionDataDir(mount);
      if (dataDir) return dataDir;
      const subdirs = this.readSubdirs(mount);
      for (const sub of subdirs) {
        if (!PathResolver.DRAGONTAIL_DIR_PATTERN.test(sub)) continue;
        dataDir = this.findLatestVersionDataDir(path.join(mount, sub));
        if (dataDir) return dataDir;
      }
    }
    return null;
  }

  private readSubdirs(dir: string): string[] {
    try { return fs.readdirSync(dir); } catch { return []; }
  }

  private findLatestVersionDataDir(mountRoot: string): string | null {
    const versions = this.readSubdirs(mountRoot)
      .filter(e => PathResolver.VERSION_PATTERN.test(e))
      .sort((a, b) => this.compareVersions(b, a));
    if (versions.length === 0) return null;
    for (const version of versions) {
      const candidate = path.join(mountRoot, version, 'data', 'en_US');
      if (fs.existsSync(candidate)) return candidate;
    }
    const first = path.join(mountRoot, versions[0], 'data', 'en_US');
    return fs.existsSync(first) ? first : null;
  }

  private compareVersions(a: string, b: string): number {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
    }
    return 0;
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
