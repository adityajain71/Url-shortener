const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB connection...');

// Get MongoDB URI from environment variable
const mongoURI = process.env.MONGODB_URI;
console.log(`MongoDB URI: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`);

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // 5 seconds timeout
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
