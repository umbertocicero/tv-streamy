// Cache manager: IndexedDB + localStorage fallback
// Strategy: IDB = completo, LS = fallback veloce, setTimeout cleanup

const DB_NAME = 'tvstreamy_cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache';

export class CacheManager {
  constructor() {
    this.db = null;
    this.initPromise = this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onerror = () => {
        console.warn('IndexedDB unavailable, falling back to localStorage');
        resolve(null);
      };

      req.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }

  async get(key) {
    await this.initPromise;

    // Prova IDB
    if (this.db) {
      try {
        const value = await this.getFromIDB(key);
        if (value !== null) return value;
      } catch (e) {
        console.warn(`IDB read failed for ${key}:`, e);
      }
    }

    // Fallback LS
    return this.getFromLS(key);
  }

  async set(key, value, ttlHours = 168) {
    await this.initPromise;

    const expires = Date.now() + ttlHours * 3600 * 1000;
    const entry = { key, value, expires };

    // Salva in IDB
    if (this.db) {
      try {
        await this.saveToIDB(entry);
      } catch (e) {
        console.warn(`IDB write failed for ${key}:`, e);
      }
    }

    // Salva in LS se piccolo
    const serialized = JSON.stringify(entry);
    if (serialized.length < 100000) {
      try {
        localStorage.setItem(`cache_${key}`, serialized);
      } catch (e) {
        console.warn(`LS write failed for ${key}:`, e);
      }
    }
  }

  async clear() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } else {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_')) localStorage.removeItem(key);
      });
    }
  }

  // Helper: IDB read
  async getFromIDB(key) {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        const entry = req.result;
        if (!entry) {
          resolve(null);
          return;
        }

        // Check expiry
        if (Date.now() > entry.expires) {
          store.delete(key);
          resolve(null);
          return;
        }

        resolve(entry.value);
      };

      req.onerror = () => reject(req.error);
    });
  }

  // Helper: IDB write
 async saveToIDB(entry) {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(entry);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Helper: LS read
 getFromLS(key) {
    try {
      const item = localStorage.getItem(`cache_${key}`);
      if (!item) return null;

      const entry = JSON.parse(item);
      if (Date.now() > entry.expires) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return entry.value;
    } catch {
      return null;
    }
  }
}

// Singleton
export const cache = new CacheManager();
