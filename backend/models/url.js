const mongoose = require('mongoose');

// Define URL schema
const urlSchema = new mongoose.Schema({
  // Original URL submitted by user
  original_url: {
    type: String,
    required: true
  },
  // Short code for shortened URL
  short_code: {
    type: String,
    required: true,
    unique: true
  },
  // Creation timestamp
  created_at: {
    type: Date,
    default: Date.now
  },
  // Number of times the shortened URL has been accessed
  clicks: {
    type: Number,
    default: 0
  }
});

// Create and export the URL model
module.exports = mongoose.model('Url', urlSchema);
