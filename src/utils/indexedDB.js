// IndexedDB utility for persistent storage (web3-native approach)
// More resilient than localStorage - survives cookie/localStorage clearing

const DB_NAME = 'StacDappDB';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

let dbInstance = null;
let initPromise = null;
let migrationDone = false;

// Initialize IndexedDB
const initDB = () => {
  if (initPromise) return initPromise;
  
  initPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not available, falling back to localStorage');
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      resolve(null); // Fallback to localStorage
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      
      // Handle database close/error events
      dbInstance.onerror = (event) => {
        console.error('IndexedDB database error:', event);
      };
      
      dbInstance.onclose = () => {
        console.warn('IndexedDB database closed, will reinitialize on next access');
        dbInstance = null;
        initPromise = null; // Reset so it can be reinitialized
      };
      
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Delete old object stores if they exist (for clean migration)
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }
      
      // Create object store
      const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      objectStore.createIndex('key', 'key', { unique: true });
    };
    
    request.onblocked = () => {
      console.warn('IndexedDB upgrade blocked - another tab may have the database open');
    };
  });

  return initPromise;
};

// Migrate localStorage data to IndexedDB on first use
const migrateFromLocalStorage = async () => {
  if (migrationDone) return;
  
  try {
    const localStorageData = localStorage.getItem('myTransactions');
    if (!localStorageData) {
      migrationDone = true;
      return;
    }

    const transactions = JSON.parse(localStorageData);
    if (transactions.length === 0) {
      migrationDone = true;
      return;
    }

    // Check if already migrated
    const existing = await getItem('myTransactions');
    if (existing && Array.isArray(existing) && existing.length > 0) {
      // Merge if needed - keep unique transactions by hash
      const existingHashes = new Set(existing.map(tx => tx.hash));
      const newTransactions = transactions.filter(tx => 
        tx.hash && !existingHashes.has(tx.hash)
      );
      if (newTransactions.length > 0) {
        const merged = [...existing, ...newTransactions].slice(0, 100);
        await setItem('myTransactions', merged);
      }
    } else {
      await setItem('myTransactions', transactions);
    }
    migrationDone = true;
  } catch (err) {
    console.error('Error migrating from localStorage:', err);
    migrationDone = true;
  }
};

// Get item from IndexedDB (with localStorage fallback)
export const getItem = async (key) => {
  try {
    // Ensure DB is initialized
    const db = await initDB();
    
    if (!db) {
      // Fallback to localStorage
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          if (result && result.value) {
            resolve(result.value);
          } else {
            // Fallback to localStorage
            const value = localStorage.getItem(key);
            resolve(value ? JSON.parse(value) : null);
          }
        };

        request.onerror = () => {
          console.error('Error reading from IndexedDB:', request.error);
          // Fallback to localStorage
          const value = localStorage.getItem(key);
          resolve(value ? JSON.parse(value) : null);
        };
        
        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
          // Fallback to localStorage
          const value = localStorage.getItem(key);
          resolve(value ? JSON.parse(value) : null);
        };
      } catch (err) {
        console.error('Error creating transaction:', err);
        // Fallback to localStorage
        const value = localStorage.getItem(key);
        resolve(value ? JSON.parse(value) : null);
      }
    });
  } catch (err) {
    console.error('Error getting item from IndexedDB:', err);
    // Fallback to localStorage
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      return null;
    }
  }
};

// Set item in IndexedDB (with localStorage fallback)
export const setItem = async (key, value) => {
  try {
    // Ensure DB is initialized
    const db = await initDB();
    
    if (!db) {
      // Fallback to localStorage
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ key, value });

        request.onsuccess = () => {
          // Also sync to localStorage as backup
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (e) {
            // Ignore localStorage errors (quota exceeded, etc.)
            console.warn('Could not backup to localStorage:', e);
          }
          resolve();
        };

        request.onerror = () => {
          console.error('Error writing to IndexedDB:', request.error);
          // Fallback to localStorage
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (e) {
            console.error('Error saving to localStorage fallback:', e);
          }
          resolve();
        };
        
        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
          // Fallback to localStorage
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (e) {
            console.error('Error saving to localStorage fallback:', e);
          }
          resolve();
        };
      } catch (err) {
        console.error('Error creating transaction:', err);
        // Fallback to localStorage
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          console.error('Error saving to localStorage fallback:', e);
        }
        resolve();
      }
    });
  } catch (err) {
    console.error('Error setting item in IndexedDB:', err);
    // Fallback to localStorage
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error saving to localStorage fallback:', e);
    }
  }
};

// Remove item from IndexedDB (with localStorage fallback)
export const removeItem = async (key) => {
  try {
    const db = await initDB();
    
    if (!db) {
      localStorage.removeItem(key);
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => {
          localStorage.removeItem(key);
          resolve();
        };

        request.onerror = () => {
          localStorage.removeItem(key);
          resolve();
        };
      } catch (err) {
        localStorage.removeItem(key);
        resolve();
      }
    });
  } catch (err) {
    console.error('Error removing item from IndexedDB:', err);
    localStorage.removeItem(key);
  }
};

// Synchronous getItem for backward compatibility (uses localStorage as cache)
export const getItemSync = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    return null;
  }
};

// Initialize and migrate on module load
if (typeof window !== 'undefined') {
  initDB().then(() => {
    migrateFromLocalStorage();
  });
}
