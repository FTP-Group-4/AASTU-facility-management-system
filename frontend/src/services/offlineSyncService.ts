import type { OfflineReport } from '../hooks/useOffline';

export class OfflineSyncService {
  private static instance: OfflineSyncService;
  private syncQueue: OfflineReport[] = [];
  private isSyncing = false;
  private syncListeners: Array<() => void> = [];

  private constructor() {}

  static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  // Add report to sync queue
  addToQueue(report: OfflineReport): void {
    this.syncQueue.push(report);
    this.notifyListeners();
  }

  // Get sync queue
  getQueue(): OfflineReport[] {
    return this.syncQueue;
  }

  // Process sync queue
  async processQueue(apiCallback: (report: OfflineReport) => Promise<any>): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    this.isSyncing = true;

    while (this.syncQueue.length > 0) {
      const report = this.syncQueue[0];

      try {
        await apiCallback(report);
        // Remove from queue on success
        this.syncQueue.shift();
        this.notifyListeners();
      } catch (error) {
        console.error('Failed to sync report:', report.id, error);
        // Keep in queue for retry
        break;
      }
    }

    this.isSyncing = false;
  }

  // Clear sync queue
  clearQueue(): void {
    this.syncQueue = [];
    this.notifyListeners();
  }

  // Retry failed syncs
  retryFailed(): void {
    // Implementation for retry logic
  }

  // Add listener for sync events
  addListener(listener: () => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.syncListeners.forEach(listener => listener());
  }
}

// Export singleton instance
export const offlineSyncService = OfflineSyncService.getInstance();