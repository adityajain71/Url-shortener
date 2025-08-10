#!/bin/sh

# Print debugging information
echo "============================================================="
echo "APPLICATION STARTUP - ENVIRONMENT INFO"
echo "============================================================="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "MONGODB_URI set: $(if [ -n "$MONGODB_URI" ]; then echo "YES"; else echo "NO"; fi)"
echo "MONGO_URL set: $(if [ -n "$MONGO_URL" ]; then echo "YES"; else echo "NO"; fi)"
echo "REACT_APP_API_URL: $REACT_APP_API_URL"
echo "============================================================="

# Try to use Railway's DATABASE_URL if MongoDB URI isn't set (Railway MongoDB integration)
if [ -z "$MONGODB_URI" ] && [ -n "$DATABASE_URL" ]; then
  echo "Using DATABASE_URL as MONGODB_URI"
  export MONGODB_URI="$DATABASE_URL"
fi

# Set NODE_ENV to production if not set
if [ -z "$NODE_ENV" ]; then
  echo "NODE_ENV not set, defaulting to production"
  export NODE_ENV=production
fi

# Set PORT to 5000 if not set
if [ -z "$PORT" ]; then
  echo "PORT not set, defaulting to 5000"
  export PORT=5000
fi

# Warn but continue if MongoDB URI is still not set
if [ -z "$MONGODB_URI" ] && [ -z "$MONGO_URL" ]; then
  echo "WARNING: Neither MONGODB_URI nor MONGO_URL environment variables are set!"
  echo "The application may not function correctly without a MongoDB connection."
  # Don't exit - we'll let the app try to handle this gracefully
  # Railway will consider the deployment failed if we exit with error
fi

# Start the application
echo "Starting application with NODE_ENV=$NODE_ENV on PORT=$PORT"
npm start
