const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const Url = require('./models/url');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON request body

// Configure CORS based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || '*' // Allow any frontend in production unless specified
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions)); // Enable CORS with configuration

// Connect to MongoDB using the connection module
console.log('Initializing MongoDB connection...');
connectDB().then(connected => {
  if (connected) {
    console.log('MongoDB connected successfully and ready for operations');
  } else {
    console.warn('Running without MongoDB connection. Some features may not work.');
  }
});

// API routes
app.use('/api', require('./routes/url'));

// System and health check routes
app.use('/api', require('./routes/system'));

/**
 * @route   GET /:shortcode
 * @desc    Redirect to the original URL
 */
app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB connection unavailable when trying to redirect', shortCode);
      return res.status(503).json({ 
        error: 'Service temporarily unavailable',
        message: 'Our database service is currently unavailable. Please try again later.'
      });
    }
    
    // Find the URL in the database with timeout
    const url = await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Database lookup timed out'));
      }, 5000);
      
      Url.findOne({ short_code: shortCode })
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          reject(err);
        });
    }).catch(err => {
      console.error('Error finding URL:', err);
      return null;
    });
    
    if (!url) {
      // If URL not found, redirect to the frontend (for handling 404s in UI)
      return res.status(404).json({ error: 'URL not found' });
    }

    // Increment the click counter but don't block the redirect
    url.clicks++;
    url.save().catch(err => {
      console.error('Error updating click count:', err);
      // Don't halt execution on save error - just log it
    });
    
    // Redirect to the original URL
    return res.redirect(url.original_url);
  } catch (err) {
    console.error('Error redirecting:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// If in production, serve static files from frontend build
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../frontend/build');
  
  // Check if the frontend build exists
  let frontendBuildExists = false;
  try {
    const stats = require('fs').statSync(frontendBuildPath);
    frontendBuildExists = stats.isDirectory();
  } catch (e) {
    console.warn('Frontend build directory not found:', e.message);
  }

  if (frontendBuildExists) {
    console.log('Serving frontend from build directory');
    // Serve static files from the React frontend app
    app.use(express.static(frontendBuildPath));

    // For any request that doesn't match one above, send back the React app's index.html file
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
  } else {
    console.log('Frontend build not found, serving fallback HTML');
    // Serve a basic HTML page if the frontend build doesn't exist
    app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>URL Shortener</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
              .container { max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #333; }
              .api-info { background: #f4f4f4; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              .error { color: #d9534f; }
              .success { color: #5cb85c; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>URL Shortener API</h1>
              <div class="api-info">
                <p>Status: <span class="${mongoose.connection.readyState === 1 ? 'success' : 'error'}">
                  ${mongoose.connection.readyState === 1 ? 'Connected to MongoDB' : 'Not connected to MongoDB'}
                </span></p>
                <p>API endpoints available:</p>
                <ul>
                  <li><code>POST /api/shorten</code> - Shorten a URL</li>
                  <li><code>GET /api/urls</code> - List all URLs</li>
                  <li><code>GET /api/health</code> - Health check</li>
                  <li><code>GET /:shortCode</code> - Redirect to original URL</li>
                </ul>
              </div>
              <p>Note: The frontend is not currently deployed with this instance. Please check your build configuration.</p>
            </div>
          </body>
        </html>
      `);
    });
  }
}

// Set port and start server
const PORT = process.env.PORT || 5000;

// Add proper error handling for the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`MongoDB: ${process.env.MONGODB_URI ? 'Configured' : 'Not Configured'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash the server, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Give the server a grace period to finish current requests
  server.close(() => {
    process.exit(1);
  });
  
  // If server doesn't close in 10 seconds, force exit
  setTimeout(() => {
    process.exit(1);
  }, 10000);
});
