import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export interface UploadResult {
  /** Filesystem path of the stored file. */
  path: string;
  /** Public URL path served by the backend (e.g. `/uploads/<file>`). */
  url: string;
}

export interface StorageService {
  upload(buffer: Buffer, opts: { mime: string; ext: string }): Promise<UploadResult>;
  delete(urlOrPath: string): Promise<void>;
  getUrl(filePath: string): string;
}

const URL_PREFIX = process.env.STORAGE_URL_PREFIX ?? '/uploads/';

export function getStorageDir(): string {
  return process.env.STORAGE_DIR ?? path.join(__dirname, '..', '..', 'uploads');
}

function resolveInsideDir(dir: string, name: string): string {
  const resolved = path.resolve(dir, name);
  const base = path.resolve(dir) + path.sep;
  if (!resolved.startsWith(base)) throw new Error('Invalid file path');
  return resolved;
}

/**
 * Local filesystem implementation of StorageService for MVP/development.
 * Replace with an S3/Supabase implementation behind the same interface
 * without changing callers or the database schema.
 */
export class LocalStorageService implements StorageService {
  constructor(private dir: string = getStorageDir()) {}

  async upload(buffer: Buffer, opts: { mime: string; ext: string }): Promise<UploadResult> {
    const ext = opts.ext.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!ext) throw new Error('Invalid file extension');
    await fs.mkdir(this.dir, { recursive: true });
    const filename = `${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`;
    const filePath = resolveInsideDir(this.dir, filename);
    await fs.writeFile(filePath, buffer);
    return { path: filePath, url: this.getUrl(filePath) };
  }

  async delete(urlOrPath: string): Promise<void> {
    const name = path.basename(urlOrPath);
    if (!name || name === '.' || name === '..') return;
    const filePath = resolveInsideDir(this.dir, name);
    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') return;
      throw err;
    }
  }

  getUrl(filePath: string): string {
    return `${URL_PREFIX}${path.basename(filePath)}`;
  }
}

export const storage: StorageService = new LocalStorageService();
