export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    return res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      message: 'Vercel serverless function is running!',
      availableEndpoints: [
        'GET /api/health',
        'GET /api/proxy/vidsrc?id=MOVIE_ID',
        'GET /api/proxy/vidsrc-to?id=MOVIE_ID&type=movie',
        'GET /api/proxy/vidsrc-me?id=MOVIE_ID&tmdb=TMDB_ID&type=movie'
      ]
    });
  }