const STORAGE_PREFIX = 'aastu_fms_';
const MAX_ITEMS = 100;
const EXPIRY_DAYS = 7;

export interface StorageItem<T> {
  id: string;
  data: T;
  timestamp: number;
  expiry: number;
}

export class OfflineStorage {
  // Save item with expiry
  static save<T>(key: string, data: T, expiryDays: number = EXPIRY_DAYS): void {
    try {
      const item: StorageItem<T> = {
        id: Math.random().toString(36).substr(2, 9),
        data,
        timestamp: Date.now(),
        expiry: Date.now() + (expiryDays * 24 * 60 * 60 * 1000)
      };

      const storageKey = `${STORAGE_PREFIX}${key}`;
      const items = this.getAll<T>(key);
      
      // Keep only latest MAX_ITEMS
      items.unshift(item);
      if (items.length > MAX_ITEMS) {
        items.pop();
      }

      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save to offline storage:', error);
    }
  }

  // Get all items (expired items are filtered out)
  static getAll<T>(key: string): StorageItem<T>[] {
    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) return [];

      const items: StorageItem<T>[] = JSON.parse(stored);
      const now = Date.now();
      
      // Filter out expired items
      const validItems = items.filter(item => item.expiry > now);
      
      // Clean up if some items expired
      if (validItems.length !== items.length) {
        this.cleanup(key);
      }

      return validItems;
    } catch (error) {
      console.error('Failed to get from offline storage:', error);
      return [];
    }
  }

  // Remove item by id
  static remove(key: string, id: string): void {
    try {
      const items = this.getAll(key);
      const filtered = items.filter(item => item.id !== id);
      
      const storageKey = `${STORAGE_PREFIX}${key}`;
      localStorage.setItem(storageKey, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove from offline storage:', error);
    }
  }

  // Clear all items
  static clear(key: string): void {
    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear offline storage:', error);
    }
  }

  // Cleanup expired items
  static cleanup(key: string): void {
    const items = this.getAll(key);
    const storageKey = `${STORAGE_PREFIX}${key}`;
    localStorage.setItem(storageKey, JSON.stringify(items));
  }

  // Get storage stats
  static getStats(): {
    totalItems: number;
    totalSize: number;
    byKey: Record<string, number>;
  } {
    const stats = {
      totalItems: 0,
      totalSize: 0,
      byKey: {} as Record<string, number>
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          const items = JSON.parse(value);
          const count = Array.isArray(items) ? items.length : 1;
          const size = new Blob([value]).size;
          
          stats.totalItems += count;
          stats.totalSize += size;
          stats.byKey[key.replace(STORAGE_PREFIX, '')] = count;
        }
      }
    }

    return stats;
  }

  // Check if offline storage is supported
  static isSupported(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
}