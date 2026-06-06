/**
 * Update Service — disabled in this fork.
 * checkForUpdates always returns "up to date"; all other methods are no-ops.
 * Signatures are preserved so callers compile unchanged.
 */

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

// Re-export Update type shape so UpdateDialog.tsx keeps compiling
export type { Update } from '@tauri-apps/plugin-updater';

export class UpdateService {
  private updateCheckInProgress = false;
  private lastCheckTime: number | null = null;
  private readonly CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

  async checkForUpdates(_force = false): Promise<UpdateInfo> {
    // Update checker disabled — this fork does not track upstream Meetily releases.
    const currentVersion = await getVersion().catch(() => '0.0.0');
    return { available: false, currentVersion };
  }

  async downloadAndInstall(_update: any, _onProgress?: (progress: UpdateProgress) => void): Promise<void> {
    // no-op
  }

  async getCurrentVersion(): Promise<string> {
    return getVersion().catch(() => '0.0.0');
  }

  wasCheckedRecently(): boolean {
    return true; // always "checked recently" so periodic hooks never fire
  }
}

// Export singleton instance
export const updateService = new UpdateService();
