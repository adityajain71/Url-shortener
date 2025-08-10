const express = require('express');
const router = express.Router();
const validUrl = require('valid-url');
const Url = require('../models/url');
const { generateShortCode } = require('../utils/codeGenerator');

/**
 * @route   POST /api/shorten
 * @desc    Create a short URL
 */
router.post('/shorten', async (req, res) => {
  // Get the original URL from request body
  const { originalUrl } = req.body;
  const baseUrl = process.env.BASE_URL;
  
  // Check if base URL is valid
  if (!validUrl.isUri(baseUrl)) {
    return res.status(401).json({ error: 'Invalid base URL' });
  }

  // Check if original URL is valid
  if (!validUrl.isUri(originalUrl)) {
    return res.status(400).json({ error: 'Invalid URL. Please provide a valid URL.' });
  }

  try {
    // Check if the URL already exists in the database
    let url = await Url.findOne({ original_url: originalUrl });

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

    // Save to database
    await url.save();
    
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
    const urls = await Url.find().sort({ created_at: -1 });
    
    // Transform the data for frontend
    const formattedUrls = urls.map(url => ({
      id: url._id,
      shortCode: url.short_code,
      shortUrl: `${process.env.BASE_URL}/${url.short_code}`,
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
    const url = await Url.findById(req.params.id);
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    res.json({
      id: url._id,
      shortCode: url.short_code,
      shortUrl: `${process.env.BASE_URL}/${url.short_code}`,
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
    const url = await Url.findById(req.params.id);
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    // Update fields
    url.original_url = originalUrl;
    
    // Save to database
    await url.save();
    
    res.json({
      success: true,
      id: url._id,
      shortCode: url.short_code,
      shortUrl: `${process.env.BASE_URL}/${url.short_code}`,
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
    const url = await Url.findById(req.params.id);
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    await Url.deleteOne({ _id: req.params.id });
    
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
    const urls = await Url.find();
    
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
    
    res.json({
      totalUrls,
      totalClicks,
      mostClickedUrl: mostClickedUrl ? {
        id: mostClickedUrl._id,
        shortCode: mostClickedUrl.short_code,
        shortUrl: `${process.env.BASE_URL}/${mostClickedUrl.short_code}`,
        originalUrl: mostClickedUrl.original_url,
        clicks: mostClickedUrl.clicks,
        createdAt: mostClickedUrl.created_at
      } : null,
      recentUrls
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

module.exports = router;
