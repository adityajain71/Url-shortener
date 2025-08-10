// MongoDB connection test script
// This script tests if we can connect to MongoDB directly

const { MongoClient } = require('mongodb');

// Check for all possible MongoDB environment variables
const possibleEnvVars = [
  'MONGODB_URI',
  'MONGO_URL',
  'DATABASE_URL',
  'MONGODB_URL',
  'MONGODB_CONNECTION_STRING'
];

// Print all environment variables for debugging (redacted)
console.log('===== ENVIRONMENT VARIABLES FOR DEBUGGING =====');
Object.keys(process.env).forEach(key => {
  if (key.includes('MONGO') || key.includes('DB') || key === 'DATABASE_URL') {
    console.log(`${key}: ${process.env[key] ? '[SET]' : '[NOT SET]'}`);
  }
});
console.log('==============================================');

// Find the first available MongoDB connection string
let mongoURI = null;
for (const envVar of possibleEnvVars) {
  if (process.env[envVar]) {
    mongoURI = process.env[envVar];
    console.log(`Found ${envVar} for MongoDB connection`);
    break;
  }
}

// If no environment variable is found, use localhost as a fallback
if (!mongoURI) {
  console.error('WARNING: No MongoDB connection string found in environment variables!');
  console.log('For local development only, falling back to localhost MongoDB.');
  mongoURI = 'mongodb://localhost:27017/url-shortener';
}

console.log(`Attempting to connect to MongoDB with URI pattern: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`);

// Try to connect
MongoClient.connect(mongoURI, { 
  connectTimeoutMS: 5000,
  socketTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000
})
  .then(client => {
    console.log('MongoDB connection test successful!');
    console.log(`Connected to database: ${client.db().databaseName}`);
    client.close();
    process.exit(0); // Success
  })
  .catch(err => {
    console.error('MongoDB connection test failed:', err);
    process.exit(1); // Failure
  });
