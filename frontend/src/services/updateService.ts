/**
 * Update Service
 *
 * Handles automatic software updates using Tauri updater plugin.
 * Provides update checking, downloading, and installation functionality.
 */

import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  version?: string;
  date?: string;
  body?: string;
  downloadUrl?: string;
}

export interface UpdateProgress {
  downloaded: number;
  total: number;
  percentage: number;
}

// Re-export Update type so UpdateDialog.tsx compiles unchanged
export type { Update };

/**
 * Update Service
 * Singleton service for managing app updates
 */
export class UpdateService {
  private updateCheckInProgress = false;
  private lastCheckTime: number | null = null;
  private readonly CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Check for available updates
   * @param force Force check even if recently checked
   * @returns Promise with update information
   */
  async checkForUpdates(force = false): Promise<UpdateInfo> {
    // Prevent concurrent update checks
    if (this.updateCheckInProgress) {
      throw new Error('Oppdateringssjekk pågår allerede');
    }

    // Skip if checked recently (unless forced)
    if (!force && this.lastCheckTime) {
      const timeSinceLastCheck = Date.now() - this.lastCheckTime;
      if (timeSinceLastCheck < this.CHECK_INTERVAL_MS) {
        console.log('[UpdateService] Hopper over sjekk – sjekket nylig');
        return {
          available: false,
          currentVersion: await getVersion().catch(() => '0.0.0'),
        };
      }
    }

    this.updateCheckInProgress = true;
    this.lastCheckTime = Date.now();

    try {
      const currentVersion = await getVersion().catch(() => '0.0.0');
      const update = await check();

      if (update) {
        return {
          available: true,
          currentVersion,
          version: update.version,
          date: update.date,
          body: update.body,
        };
      }

      return {
        available: false,
        currentVersion,
      };
    } catch (error) {
      console.error('[UpdateService] Kunne ikke sjekke etter oppdateringer:', error);
      throw error;
    } finally {
      this.updateCheckInProgress = false;
    }
  }

  /**
   * Download and install the available update with progress callbacks.
   * The Update object is obtained by calling check() inside UpdateDialog or
   * passed in directly from callers that already have a handle to it.
   * After install completes the app is relaunched via plugin-process.
   *
   * @param update  The Update object returned by check()
   * @param onProgress  Optional progress callback
   */
  async downloadAndInstall(
    update: Update,
    onProgress?: (progress: UpdateProgress) => void
  ): Promise<void> {
    try {
      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength ?? 0;
            if (onProgress) {
              onProgress({ downloaded: 0, total: contentLength, percentage: 0 });
            }
            break;

          case 'Progress':
            downloaded += event.data.chunkLength ?? 0;
            if (onProgress) {
              const percentage = contentLength > 0
                ? Math.round((downloaded / contentLength) * 100)
                : 0;
              onProgress({ downloaded, total: contentLength, percentage });
            }
            break;

          case 'Finished':
            if (onProgress) {
              onProgress({ downloaded: contentLength, total: contentLength, percentage: 100 });
            }
            break;
        }
      });

      await relaunch();
    } catch (error) {
      console.error('[UpdateService] Nedlasting/installasjon mislyktes:', error);
      throw error;
    }
  }

  /**
   * Get the current app version
   */
  async getCurrentVersion(): Promise<string> {
    return getVersion().catch(() => '0.0.0');
  }

  /**
   * Check if an update check was performed recently
   */
  wasCheckedRecently(): boolean {
    if (!this.lastCheckTime) return false;
    return (Date.now() - this.lastCheckTime) < this.CHECK_INTERVAL_MS;
  }
}

// Export singleton instance
export const updateService = new UpdateService();
