// Vercel Serverless Function - API Proxy
// This proxies requests from your HTTPS site to your HTTP API server

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Get the path from the URL (everything after /api/punishments/)
        const { path } = req.query;
        const apiPath = Array.isArray(path) ? path.join('/') : path || '';
        
        // Your backend API URL
        const backendUrl = `http://nd.mememc.club:25570/punishments/${apiPath}`;
        
        console.log('Proxying request to:', backendUrl);

        // Forward the request to your backend
        const response = await fetch(backendUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        
        // Return the response
        res.status(200).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch from backend API',
            message: error.message 
        });
    }
}
