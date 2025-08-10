const mongoose = require('mongoose');

// MongoDB connection with retry logic
const connectDB = async (retryCount = 5) => {
  // Check for all possible MongoDB environment variables that might be set
  const possibleEnvVars = [
    'MONGODB_URI',        // Our primary variable
    'MONGO_URL',          // Another common variable
    'DATABASE_URL',       // Railway's MongoDB plugin typically sets this
    'MONGODB_URL',        // Another possible variable
    'MONGODB_CONNECTION_STRING' // Yet another possible variable
  ];

  // Find the first available MongoDB connection string from the possible environment variables
  let mongoURI = null;
  for (const envVar of possibleEnvVars) {
    if (process.env[envVar]) {
      mongoURI = process.env[envVar];
      console.log(`Using ${envVar} for MongoDB connection`);
      
      // Validate that the URI starts with mongodb:// or mongodb+srv://
      if (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://')) {
        console.error(`ERROR: Invalid MongoDB URI in ${envVar}. URI must start with mongodb:// or mongodb+srv://`);
        console.error(`Current value starts with: ${mongoURI.substring(0, 15)}...`);
        // Try to fix common issues like missing 'm' at the beginning
        if (mongoURI.startsWith('ongodb://') || mongoURI.startsWith('ongodb+srv://')) {
          mongoURI = 'm' + mongoURI;
          console.log(`Attempting to fix URI by adding missing 'm' character.`);
        } else {
          // Don't use an invalid URI
          mongoURI = null;
          continue;
        }
      }
      
      break;
    }
  }

  // If no environment variable is found, handle differently based on environment
  if (!mongoURI) {
    console.error('WARNING: No MongoDB connection string found in environment variables!');
    
    if (process.env.NODE_ENV === 'production') {
      // In production, use our MongoDB Atlas connection string as a fallback
      console.warn('MONGODB_URI not found in environment. Using hardcoded MongoDB Atlas connection.');
      
      // Use our MongoDB Atlas connection string
      // NOTE: In a real production environment, you should store this in an environment variable
      mongoURI = 'mongodb+srv://adityapradipjain2005:<db_password>@cluster0.gsaet3.mongodb.net/url-shortener?retryWrites=true&w=majority&appName=Cluster0';
      
      console.log('Using fallback MongoDB Atlas connection');
    } else {
      // For development, use localhost
      console.log('For local development only, falling back to localhost MongoDB.');
      mongoURI = 'mongodb://localhost:27017/url-shortener';
    }
  }

  // Log MongoDB connection info (without exposing sensitive information)
  console.log(`MongoDB Connection Info:`);
  console.log(`- Using URI pattern: ${mongoURI ? mongoURI.replace(/\/\/.*@/, '//***:***@').slice(0, 20) + '...' : 'Not set'}`);
  console.log(`- Environment: ${process.env.NODE_ENV || 'Not set'}`);
  console.log(`- Attempt: ${6 - retryCount} of 5`);
  
  // Debug info for troubleshooting production deployments
  if (process.env.NODE_ENV === 'production') {
    console.log('Environment variables check:');
    for (const envVar of possibleEnvVars) {
      console.log(`- ${envVar}: ${process.env[envVar] ? 'Set' : 'Not set'}`);
    }
    
    // Check if this is a MongoDB Atlas URL
    const isAtlasUrl = mongoURI && mongoURI.includes('mongodb+srv');
    if (!isAtlasUrl && process.env.NODE_ENV === 'production') {
      console.warn('Warning: Not using MongoDB Atlas in production environment!');
    }
  }

  try {
    // Configure mongoose options
    const mongooseOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increased timeout to 30 seconds
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4  // Force IPv4 (sometimes helps with connection issues)
    };

    // Attempt to connect to MongoDB
    await mongoose.connect(mongoURI, mongooseOptions);
    
    console.log('MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
      // Don't crash the server, attempt to reconnect
      setTimeout(() => connectDB(1), 5000);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      // Attempt to reconnect
      setTimeout(() => connectDB(1), 5000);
    });
    
    // Handle app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    
    // Check for specific error types and provide more helpful messages
    if (err.name === 'MongooseServerSelectionError') {
      console.error('=== CONNECTION TROUBLESHOOTING GUIDE ===');
      console.error('1. Check if your MongoDB Atlas IP whitelist includes 0.0.0.0/0 to allow all IPs');
      console.error('2. Verify username and password are correct in the connection string');
      console.error('3. Ensure the cluster name and database name are correct');
      console.error('4. Check if your MongoDB Atlas cluster is running and accessible');
      console.error('=== END TROUBLESHOOTING GUIDE ===');
    }
    
    // If we have retries left, try again after a delay
    if (retryCount > 0) {
      console.log(`Retrying connection in 5 seconds... (${retryCount} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retryCount - 1);
    } else {
      console.error('Failed to connect to MongoDB after multiple attempts');
      
      // In production, we don't want to crash the server - let the app run without DB
      if (process.env.NODE_ENV === 'production') {
        console.log('Running in production without MongoDB connection.');
        return false;
      } else {
        // In development, we might want to exit
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
