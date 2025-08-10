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
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// API routes
app.use('/api', require('./routes/url'));

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
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
  // Serve static files from the React frontend app
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  // For any request that doesn't match one above, send back the React app's index.html file
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
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
