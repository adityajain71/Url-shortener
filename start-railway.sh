#!/bin/sh

# Make sure MongoDB URI is set
if [ -z "$MONGODB_URI" ]; then
  echo "Error: MONGODB_URI environment variable is not set!"
  exit 1
fi

# Set NODE_ENV to production if not set
if [ -z "$NODE_ENV" ]; then
  export NODE_ENV=production
fi

# Set PORT to 5000 if not set
if [ -z "$PORT" ]; then
  export PORT=5000
fi

# Start the application
echo "Starting application with NODE_ENV=$NODE_ENV on PORT=$PORT"
npm start
