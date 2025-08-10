// Configuration for API endpoints
const config = {
  API_BASE_URL: process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_BASE_URL || '' // Will be set during deployment
    : '', // Empty string will use the proxy from package.json in development
};

export default config;
