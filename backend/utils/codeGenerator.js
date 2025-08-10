const { nanoid } = require('nanoid');

/**
 * Generates a unique short code for URLs
 * @param {number} length - Length of the short code to generate (default: 6)
 * @returns {string} - Generated short code
 */
function generateShortCode(length = 6) {
  // Using nanoid to generate a URL-friendly unique ID
  // The default alphabet is URL-friendly and excludes lookalikes: 1, l, I, 0, O, etc.
  return nanoid(length);
}

module.exports = { generateShortCode };
