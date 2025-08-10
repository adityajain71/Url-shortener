const express = require('express');
const router = express.Router();
const validUrl = require('valid-url');
const mongoose = require('mongoose');
const Url = require('../models/url');
const { generateShortCode } = require('../utils/codeGenerator');

// Wrap database operations with timeout and error handling
const withTimeout = (promise, timeoutMs = 5000) => {
  let timeoutHandle;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).then(result => {
    clearTimeout(timeoutHandle);
    return result;
  }).catch(err => {
    clearTimeout(timeoutHandle);
    throw err;
  });
};

/**
 * @route   POST /api/shorten
 * @desc    Create a short URL
 */
router.post('/shorten', async (req, res) => {
  // Get the original URL from request body
  const { originalUrl } = req.body;
  
  // Get base URL from env or construct from request
  let baseUrl = process.env.BASE_URL;
  if (!baseUrl || !validUrl.isUri(baseUrl)) {
    baseUrl = `${req.protocol}://${req.get('host')}`;
  }

  // Check if original URL is valid
  if (!validUrl.isUri(originalUrl)) {
    return res.status(400).json({ error: 'Invalid URL. Please provide a valid URL.' });
  }

  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB is not connected. Will create URL without persistence.');
      
      // Create a non-persistent short URL (will not be saved to DB)
      const shortCode = generateShortCode();
      
      return res.json({
        success: true,
        shortUrl: `${baseUrl}/${shortCode}`,
        shortCode,
        originalUrl,
        temporary: true,
        warning: "Database connection unavailable. This URL will not be permanently stored."
      });
    }

    // Check if the URL already exists in the database
    let url = await withTimeout(
      Url.findOne({ original_url: originalUrl }),
      10000
    ).catch(err => {
      console.error('Error finding URL:', err);
      return null;
    });

    if (url) {
      // Return the existing shortened URL
      return res.json({
        success: true,
        shortUrl: `${baseUrl}/${url.short_code}`,
        shortCode: url.short_code,
        originalUrl: url.original_url,
        clicks: url.clicks,
        createdAt: url.created_at
      });
    }

    // Generate a short code
    const shortCode = generateShortCode();
    
    // Create a new URL record
    url = new Url({
      original_url: originalUrl,
      short_code: shortCode,
    });

    // Save to database with timeout
    await withTimeout(url.save(), 10000).catch(err => {
      console.error('Error saving URL:', err);
      throw new Error('Failed to save URL');
    });
    
    // Return the shortened URL and details
    res.json({
      success: true,
      shortUrl: `${baseUrl}/${shortCode}`,
      shortCode,
      originalUrl: url.original_url,
      clicks: url.clicks,
      createdAt: url.created_at
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

/**
 * @route   GET /api/urls
 * @desc    Get all URLs
 */
router.get('/urls', async (req, res) => {
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database service temporarily unavailable',
        message: 'Our service is experiencing connectivity issues. Please try again later.'
      });
    }

    // Find URLs with timeout
    const urls = await withTimeout(
      Url.find().sort({ created_at: -1 }),
      10000
    ).catch(err => {
      console.error('Error finding URLs:', err);
      return [];
    });
    
    // Get base URL from env or construct default
    let baseUrl = process.env.BASE_URL;
    if (!baseUrl || !validUrl.isUri(baseUrl)) {
      baseUrl = `${req.protocol}://${req.get('host')}`;
    }
    
    // Transform the data for frontend
    const formattedUrls = urls.map(url => ({
      id: url._id,
      shortCode: url.short_code,
      shortUrl: `${baseUrl}/${url.short_code}`,
      originalUrl: url.original_url,
      clicks: url.clicks,
      createdAt: url.created_at
    }));
    
    res.json(formattedUrls);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

/**
 * @route   GET /api/url/:id
 * @desc    Get a specific URL by ID
 */
router.get('/url/:id', async (req, res) => {
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database service temporarily unavailable',
        message: 'Our service is experiencing connectivity issues. Please try again later.'
      });
    }

    // Add error handling for invalid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid URL ID format' });
    }

    // Find URL with timeout
    const url = await withTimeout(
      Url.findById(req.params.id),
      5000
    ).catch(err => {
      console.error('Error finding URL by ID:', err);
      return null;
    });
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    // Get base URL from env or construct default
    let baseUrl = process.env.BASE_URL;
    if (!baseUrl || !validUrl.isUri(baseUrl)) {
      baseUrl = `${req.protocol}://${req.get('host')}`;
    }
    
    res.json({
      id: url._id,
      shortCode: url.short_code,
      shortUrl: `${baseUrl}/${url.short_code}`,
      originalUrl: url.original_url,
      clicks: url.clicks,
      createdAt: url.created_at
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

/**
 * @route   PUT /api/url/:id
 * @desc    Update a URL
 */
router.put('/url/:id', async (req, res) => {
  const { originalUrl } = req.body;
  
  // Validate URL
  if (!validUrl.isUri(originalUrl)) {
    return res.status(400).json({ error: 'Invalid URL. Please provide a valid URL.' });
  }
  
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database service temporarily unavailable',
        message: 'Our service is experiencing connectivity issues. Please try again later.'
      });
    }

    // Add error handling for invalid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid URL ID format' });
    }
    
    // Find URL with timeout
    const url = await withTimeout(
      Url.findById(req.params.id),
      5000
    ).catch(err => {
      console.error('Error finding URL by ID:', err);
      return null;
    });
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    // Update fields
    url.original_url = originalUrl;
    
    // Save to database with timeout
    await withTimeout(url.save(), 5000).catch(err => {
      console.error('Error saving URL update:', err);
      throw new Error('Failed to save URL update');
    });
    
    // Get base URL from env or construct default
    let baseUrl = process.env.BASE_URL;
    if (!baseUrl || !validUrl.isUri(baseUrl)) {
      baseUrl = `${req.protocol}://${req.get('host')}`;
    }
    
    res.json({
      success: true,
      id: url._id,
      shortCode: url.short_code,
      shortUrl: `${baseUrl}/${url.short_code}`,
      originalUrl: url.original_url,
      clicks: url.clicks,
      createdAt: url.created_at
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

/**
 * @route   DELETE /api/url/:id
 * @desc    Delete a URL
 */
router.delete('/url/:id', async (req, res) => {
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database service temporarily unavailable',
        message: 'Our service is experiencing connectivity issues. Please try again later.'
      });
    }

    // Add error handling for invalid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid URL ID format' });
    }
    
    // Find URL with timeout
    const url = await withTimeout(
      Url.findById(req.params.id),
      5000
    ).catch(err => {
      console.error('Error finding URL by ID:', err);
      return null;
    });
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    // Delete with timeout
    await withTimeout(
      Url.deleteOne({ _id: req.params.id }),
      5000
    ).catch(err => {
      console.error('Error deleting URL:', err);
      throw new Error('Failed to delete URL');
    });
    
    res.json({ success: true, message: 'URL deleted successfully' });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

/**
 * @route   GET /api/stats
 * @desc    Get URL statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database service temporarily unavailable',
        message: 'Our service is experiencing connectivity issues. Please try again later.'
      });
    }

    // Find URLs with timeout
    const urls = await withTimeout(
      Url.find(),
      10000
    ).catch(err => {
      console.error('Error finding URLs for stats:', err);
      return [];
    });
    
    // Calculate stats
    const totalUrls = urls.length;
    const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);
    
    // Find most clicked URL
    const mostClickedUrl = urls.length > 0 
      ? urls.reduce((prev, current) => (prev.clicks > current.clicks) ? prev : current) 
      : null;
    
    // Count URLs created in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const recentUrls = urls.filter(url => url.created_at > oneDayAgo).length;
    
    // Get base URL from env or construct default
    let baseUrl = process.env.BASE_URL;
    if (!baseUrl || !validUrl.isUri(baseUrl)) {
      baseUrl = `${req.protocol}://${req.get('host')}`;
    }
    
    res.json({
      totalUrls,
      totalClicks,
      mostClickedUrl: mostClickedUrl ? {
        id: mostClickedUrl._id,
        shortCode: mostClickedUrl.short_code,
        shortUrl: `${baseUrl}/${mostClickedUrl.short_code}`,
        originalUrl: mostClickedUrl.original_url,
        clicks: mostClickedUrl.clicks,
        createdAt: mostClickedUrl.created_at
      } : null,
      recentUrls,
      dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

module.exports = router;
