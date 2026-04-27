/* global process */
export default async function handler(req, res) {
  // 1. Security check: Only allow POST requests (for GraphQL)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUBGRAPH_URL = process.env.VITE_SUBGRAPH_URL;

  if (!SUBGRAPH_URL) {
    return res.status(500).json({ error: 'Subgraph URL not configured on server' });
  }

  try {
    // 2. Forward the query to Goldsky
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // 3. Send the data back to your frontend
    res.status(200).json(data);
  } catch (error) {
    console.error('[Subgraph Proxy Error]:', error);
    res.status(500).json({ error: 'Failed to fetch data from Subgraph' });
  }
}
