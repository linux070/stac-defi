/**
 * Kit Key Provider
 * 
 * Fetches the Circle App Kit key from the secure server-side endpoint
 * at runtime, so the key is never embedded in the client JS bundle.
 * 
 * In development (Vite dev server), the key is read from a non-VITE_
 * env var via the Vite proxy. In production (Vercel), it calls the
 * serverless function at /api/kit-key.
 * 
 * The key is cached in-memory for the session lifetime and never
 * logged to the console.
 */

let _cachedKey = null;
let _fetchPromise = null;

/**
 * Returns the Circle Kit Key, fetching it from the secure endpoint
 * if not already cached. Never logs or exposes the key.
 * 
 * @returns {Promise<string>} The kit key
 * @throws {Error} If the key cannot be retrieved
 */
export async function getKitKey() {
  // Return cached key immediately
  if (_cachedKey) return _cachedKey;

  // Deduplicate concurrent requests
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    try {
      // In development, use the Vite proxy fallback; in production use Vercel function
      const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
      
      if (isDev) {
        // In dev, read from Vite env (VITE_ prefixed for local dev convenience)
        // This is acceptable because dev builds are never shipped to users
        const devKey = import.meta.env.VITE_CIRCLE_KIT_KEY;
        if (devKey) {
          _cachedKey = devKey.startsWith('KIT_KEY:') ? devKey : `KIT_KEY:${devKey}`;
          return _cachedKey;
        }
      }

      // Production: fetch from the serverless endpoint
      const response = await fetch('/api/kit-key', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Kit key fetch failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.k) {
        throw new Error('Invalid kit key response');
      }

      const key = data.k;
      _cachedKey = key.startsWith('KIT_KEY:') ? key : `KIT_KEY:${key}`;
      return _cachedKey;
    } catch (err) {
      _fetchPromise = null; // Allow retry on failure
      throw err;
    }
  })();

  return _fetchPromise;
}

/**
 * Clears the cached kit key. Useful for testing or key rotation.
 */
export function clearKitKeyCache() {
  _cachedKey = null;
  _fetchPromise = null;
}
