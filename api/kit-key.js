/* global process */
/**
 * Vercel Serverless Function — Kit Key Proxy
 * 
 * This endpoint returns the Circle App Kit key at runtime so it never
 * has to be embedded in the client JS bundle. The key is stored in
 * Vercel's environment variables (not VITE_ prefixed, so Vite won't
 * inline it).
 *
 * Security layers:
 *  1. Origin / Referer validation — only your deployed domain can call this.
 *  2. The key is never in the git repo or the client bundle.
  */

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://stac-defi.vercel.app',
  'https://stacdefi.app',
  'https://www.stacdefi.app',
];

export default function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || '';

  // CORS: only allow known origins
  const isAllowed = ALLOWED_ORIGINS.some(
    (allowed) => origin.startsWith(allowed)
  );

  if (!isAllowed) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const kitKey = process.env.CIRCLE_KIT_KEY;

  if (!kitKey) {
    res.status(500).json({ error: 'Kit key not configured' });
    return;
  }

  res.status(200).json({ k: kitKey });
}
