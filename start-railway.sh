#!/bin/sh

# Create a log file
LOGFILE="/app/backend/logs/startup-$(date +%Y%m%d-%H%M%S).log"
touch $LOGFILE
echo "Logging startup to $LOGFILE"

# Function to log messages to console and file
log() {
  echo "$1"
  echo "$(date +%Y-%m-%d\ %H:%M:%S) - $1" >> $LOGFILE
}

log "============================================================="
log "APPLICATION STARTUP - ENVIRONMENT INFO"
log "============================================================="
log "NODE_ENV: $NODE_ENV"
log "PORT: $PORT"
log "MONGODB_URI set: $(if [ -n "$MONGODB_URI" ]; then echo "YES"; else echo "NO"; fi)"
log "MONGO_URL set: $(if [ -n "$MONGO_URL" ]; then echo "YES"; else echo "NO"; fi)"
log "DATABASE_URL set: $(if [ -n "$DATABASE_URL" ]; then echo "YES"; else echo "NO"; fi)"
log "REACT_APP_API_URL: $REACT_APP_API_URL"
log "============================================================="

# Try all possible MongoDB environment variables
if [ -z "$MONGODB_URI" ]; then
  if [ -n "$DATABASE_URL" ]; then
    log "Setting MONGODB_URI from DATABASE_URL"
    export MONGODB_URI="$DATABASE_URL"
  elif [ -n "$MONGO_URL" ]; then
    log "Setting MONGODB_URI from MONGO_URL"
    export MONGODB_URI="$MONGO_URL"
  fi
fi

# Print the first few characters of the MongoDB URI (if set) for debugging
if [ -n "$MONGODB_URI" ]; then
  URI_START=$(echo $MONGODB_URI | cut -c 1-20)
  log "MongoDB URI starts with: $URI_START..."
else
  log "WARNING: No MongoDB URI found in environment variables!"
fi

# Set NODE_ENV to production if not set
if [ -z "$NODE_ENV" ]; then
  log "NODE_ENV not set, defaulting to production"
  export NODE_ENV=production
fi

# Set PORT to 5000 if not set
if [ -z "$PORT" ]; then
  log "PORT not set, defaulting to 5000"
  export PORT=5000
fi

# Test MongoDB connection
log "Testing MongoDB connection..."
cd /app/backend && node scripts/mongodb-check.js >> $LOGFILE 2>&1
if [ $? -eq 0 ]; then
  log "MongoDB connection test successful!"
else
  log "MongoDB connection test failed! Check the logs for details."
  # We continue anyway to let the application handle this
fi

# Start the application
log "Starting application with NODE_ENV=$NODE_ENV on PORT=$PORT"
npm start
