/**
 * File system helper for testing project setup
 * Provides utilities to verify file existence and content
 */
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

export interface FileCheck {
  path: string;
  exists: boolean;
  content?: string;
  isDirectory?: boolean;
}

export class FileHelper {
  constructor(private projectRoot: string) {}

  /**
   * Check if a file or directory exists
   */
  exists(relativePath: string): boolean {
    return existsSync(join(this.projectRoot, relativePath));
  }

  /**
   * Read file content as string
   */
  readFile(relativePath: string): string {
    const fullPath = join(this.projectRoot, relativePath);
    if (!existsSync(fullPath)) {
      throw new Error(`File does not exist: ${relativePath}`);
    }
    return readFileSync(fullPath, 'utf-8');
  }

  /**
   * Check if path is a directory
   */
  isDirectory(relativePath: string): boolean {
    const fullPath = join(this.projectRoot, relativePath);
    return existsSync(fullPath) && statSync(fullPath).isDirectory();
  }

  /**
   * Verify multiple files exist
   */
  checkFiles(paths: string[]): FileCheck[] {
    return paths.map(path => ({
      path,
      exists: this.exists(path),
      isDirectory: this.isDirectory(path),
      ...(this.exists(path) && !this.isDirectory(path) && { content: this.readFile(path) }),
    }));
  }

  /**
   * Parse JSON file safely
   */
  parseJson(relativePath: string): any {
    try {
      return JSON.parse(this.readFile(relativePath));
    } catch (error) {
      throw new Error(`Invalid JSON in ${relativePath}: ${error.message}`);
    }
  }
}
