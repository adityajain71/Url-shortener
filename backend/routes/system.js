const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// System health and information endpoint
router.get('/health', (req, res) => {
  // Check MongoDB connection state
  const mongooseState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][mongooseState];
  
  // Get environment info
  const environment = process.env.NODE_ENV || 'development';
  
  // Get memory usage
  const memoryUsage = process.memoryUsage();
  const formattedMemory = {
    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
  };
  
  // Check if we have MongoDB env vars
  const mongodbVars = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    MONGO_URL: !!process.env.MONGO_URL,
    DATABASE_URL: !!process.env.DATABASE_URL
  };

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    environment,
    database: {
      state: mongooseState,
      status: dbStatus,
      connectionStringPresent: !!mongoose.connection.getClient().s.url
    },
    mongoEnvVars: mongodbVars,
    memory: formattedMemory
  });
});

// System diagnostic page
router.get('/system', (req, res) => {
  // Send an HTML page with diagnostic information
  const mongooseState = mongoose.connection.readyState;
  const dbStatus = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][mongooseState];
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>URL Shortener - System Diagnostics</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          .section { background: #f4f4f4; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .error { color: #d9534f; }
          .success { color: #5cb85c; }
          .info { color: #5bc0de; }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>URL Shortener - System Diagnostics</h1>
          
          <div class="section">
            <h2>Environment</h2>
            <table>
              <tr><th>Setting</th><th>Value</th></tr>
              <tr><td>Node.js Version</td><td>${process.version}</td></tr>
              <tr><td>Environment</td><td>${process.env.NODE_ENV || 'Not Set'}</td></tr>
              <tr><td>Platform</td><td>${process.platform}</td></tr>
              <tr><td>Uptime</td><td>${Math.floor(process.uptime())} seconds</td></tr>
            </table>
          </div>
          
          <div class="section">
            <h2>Database Connection</h2>
            <p>Status: <span class="${mongooseState === 1 ? 'success' : 'error'}">${dbStatus}</span></p>
            <p>MongoDB Environment Variables:</p>
            <table>
              <tr><th>Variable</th><th>Status</th></tr>
              <tr><td>MONGODB_URI</td><td>${process.env.MONGODB_URI ? '<span class="success">Set</span>' : '<span class="error">Not Set</span>'}</td></tr>
              <tr><td>MONGO_URL</td><td>${process.env.MONGO_URL ? '<span class="success">Set</span>' : '<span class="error">Not Set</span>'}</td></tr>
              <tr><td>DATABASE_URL</td><td>${process.env.DATABASE_URL ? '<span class="success">Set</span>' : '<span class="error">Not Set</span>'}</td></tr>
            </table>
          </div>
          
          <div class="section">
            <h2>Memory Usage</h2>
            <table>
              <tr><th>Metric</th><th>Value</th></tr>
              <tr><td>RSS</td><td>${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB</td></tr>
              <tr><td>Heap Total</td><td>${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB</td></tr>
              <tr><td>Heap Used</td><td>${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB</td></tr>
            </table>
          </div>
          
          <div class="section">
            <h2>API Status</h2>
            <p>The following API endpoints are available:</p>
            <ul>
              <li><code>GET /api/health</code> - Health check JSON response</li>
              <li><code>GET /api/system</code> - This diagnostic page</li>
              <li><code>POST /api/shorten</code> - Shorten a URL</li>
              <li><code>GET /api/urls</code> - List all URLs</li>
            </ul>
          </div>
        </div>
      </body>
    </html>
  `;
  
  res.send(html);
});

module.exports = router;
