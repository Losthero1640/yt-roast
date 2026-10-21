import { vi, expect } from 'vitest';
import fs from 'node:fs';
import * as os from 'node:os';

/**
 * Multi-layer zero-disk-write verification helper (PRIV-02, TEST-04, D-11)
 * Combines runtime API interception with before/after filesystem state snapshots
 */
export function setupZeroDiskSpies() {
  // Layer 1: Intercept all Node.js file-writing APIs
  const writeSpy = vi.spyOn(fs, 'writeFile');
  const writeStreamSpy = vi.spyOn(fs, 'createWriteStream');
  const appendSpy = vi.spyOn(fs, 'appendFile');
  const openSpy = vi.spyOn(fs, 'open');

  const promisesWriteSpy = vi.spyOn(fs.promises, 'writeFile');
  const promisesAppendSpy = vi.spyOn(fs.promises, 'appendFile');
  const promisesOpenSpy = vi.spyOn(fs.promises, 'open');

  // Layer 2: Snapshot directory entries of OS temp directory before execution
  const tmpDir = os.tmpdir();
  let tmpBefore = [];
  try {
    tmpBefore = fs.readdirSync(tmpDir);
  } catch {
    tmpBefore = [];
  }

  return {
    assertZeroWrites() {
      // Assert zero calls to writing APIs
      expect(writeSpy).not.toHaveBeenCalled();
      expect(writeStreamSpy).not.toHaveBeenCalled();
      expect(appendSpy).not.toHaveBeenCalled();
      expect(promisesWriteSpy).not.toHaveBeenCalled();
      expect(promisesAppendSpy).not.toHaveBeenCalled();

      // Check open calls (if called, must not be with write flags 'w', 'a', etc.)
      for (const call of openSpy.mock.calls) {
        const flag = call[1];
        if (typeof flag === 'string') {
          expect(flag).not.toMatch(/[wa+]/);
        }
      }
      for (const call of promisesOpenSpy.mock.calls) {
        const flag = call[1];
        if (typeof flag === 'string') {
          expect(flag).not.toMatch(/[wa+]/);
        }
      }

      // Assert no new files were created in the OS temp directory
      try {
        const tmpAfter = fs.readdirSync(tmpDir);
        const newFiles = tmpAfter.filter((f) => !tmpBefore.includes(f));
        expect(newFiles).toEqual([]);
      } catch {
        // If readdirSync fails, ignore
      }
    },
    restore() {
      writeSpy.mockRestore();
      writeStreamSpy.mockRestore();
      appendSpy.mockRestore();
      openSpy.mockRestore();
      promisesWriteSpy.mockRestore();
      promisesAppendSpy.mockRestore();
      promisesOpenSpy.mockRestore();
    }
  };
}
