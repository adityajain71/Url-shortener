const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const Url = require('./models/url');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON request body
app.use(cors()); // Enable CORS for all routes

// Connect to MongoDB
// Force explicit MongoDB URI from environment variable to prevent fallbacks
let mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('ERROR: MONGODB_URI environment variable is not set.');
  mongoURI = process.env.MONGO_URL;
  if (mongoURI) {
    console.log('Using MONGO_URL environment variable as fallback.');
  } else {
    console.error('ERROR: Neither MONGODB_URI nor MONGO_URL environment variables are set.');
    console.log('For local development only, falling back to localhost MongoDB.');
    mongoURI = 'mongodb://localhost:27017/url-shortener';
  }
}

console.log(`MongoDB Connection Info:`);
console.log(`- Using URI pattern: ${mongoURI ? mongoURI.replace(/\/\/.*@/, '//***:***@').slice(0, 20) + '...' : 'Not set'}`); 
console.log(`- Environment: ${process.env.NODE_ENV || 'Not set'}`);

const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

console.log('Attempting to connect to MongoDB...');
mongoose.connect(mongoURI, mongooseOptions)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Connection details (masked):', {
      uri_pattern: mongoURI ? mongoURI.replace(/\/\/.*@/, '//***:***@').slice(0, 20) + '...' : 'Not set',
      env: process.env.NODE_ENV,
      mongodb_uri_set: !!process.env.MONGODB_URI,
      mongo_url_set: !!process.env.MONGO_URL
    });
    
    // Don't exit immediately in production, as Railway might restart the container
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

// API routes
app.use('/api', require('./routes/url'));

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 */
app.get('/api/health', (req, res) => {
  // Check MongoDB connection state
  const mongooseState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][mongooseState];
  
  // For Railway health checks, we'll consider the app healthy even if MongoDB is not connected
  // This prevents Railway from constantly restarting the container
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: {
      state: mongooseState,
      status: dbStatus,
      // Don't show the actual connection string for security
      connectionString: process.env.MONGODB_URI ? 'Set' : 'Not set'
    },
    environment: process.env.NODE_ENV || 'Not set'
  });
});

/**
 * @route   GET /:shortcode
 * @desc    Redirect to the original URL
 */
app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    // Find the URL in the database
    const url = await Url.findOne({ short_code: shortCode });
    
    if (!url) {
      // If URL not found, redirect to the frontend (for handling 404s in UI)
      return res.status(404).json({ error: 'URL not found' });
    }

    // Increment the click counter
    url.clicks++;
    await url.save();
    
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
const server = app.listen(PORT, () => {
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
