# URL Shortener Deployment Guide

This guide provides instructions for deploying the URL shortener application to various cloud platforms.

## Prerequisites

- Node.js and npm installed
- Git installed
- MongoDB Atlas account (for cloud database)
- Account on your chosen cloud platform (Railway, Heroku, Vercel, Netlify, etc.)

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account if you don't have one
2. Create a new cluster (free tier is sufficient for starting)
3. Under "Network Access," add your IP address or set to allow access from anywhere (0.0.0.0/0)
4. Under "Database Access," create a user with read/write permissions
5. Under "Clusters," click "Connect" and select "Connect your application"
6. Copy the connection string, which will look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/url-shortener?retryWrites=true&w=majority
   ```
7. Replace `<username>` and `<password>` with your actual credentials

## Option 1: Deploying to Heroku (Combined Deployment)

1. Create a Heroku account if you don't have one
2. Install the Heroku CLI
3. Log in to Heroku CLI:
   ```
   heroku login
   ```
4. Navigate to your project root and create a Heroku app:
   ```
   cd url-shortener
   heroku create your-url-shortener-app
   ```
5. Add the MongoDB connection string to Heroku config:
   ```
   heroku config:set MONGODB_URI="your-mongodb-atlas-connection-string"
   heroku config:set BASE_URL="https://your-url-shortener-app.herokuapp.com"
   heroku config:set NODE_ENV="production"
   ```
6. Commit your code if you haven't already:
   ```
   git add .
   git commit -m "Ready for deployment"
   ```
7. Deploy to Heroku:
   ```
   git push heroku main
   ```
8. Open your application:
   ```
   heroku open
   ```

## Option 2: Separate Frontend and Backend Deployment

### Backend Deployment to Heroku

1. Navigate to your backend directory:
   ```
   cd url-shortener/backend
   ```
2. Create a new Heroku app for the backend:
   ```
   heroku create your-url-shortener-api
   ```
3. Add MongoDB connection string and other environment variables:
   ```
   heroku config:set MONGODB_URI="your-mongodb-atlas-connection-string"
   heroku config:set BASE_URL="https://your-url-shortener-api.herokuapp.com"
   heroku config:set NODE_ENV="production"
   ```
4. Deploy the backend:
   ```
   git subtree push --prefix backend heroku main
   ```

### Frontend Deployment to Vercel

1. Update the API base URL in the frontend .env file:
   ```
   REACT_APP_API_URL=https://your-url-shortener-api.herokuapp.com/api
   ```
2. Build the frontend:
   ```
   cd frontend
   npm run build
   ```
3. Install Vercel CLI:
   ```
   npm install -g vercel
   ```
4. Deploy to Vercel:
   ```
   vercel login
   vercel
   ```

## Option 3: Deploying to Railway

Railway is a modern cloud platform that makes deploying applications simple. Here's how to deploy your URL shortener to Railway:

### Prerequisites

1. Create a Railway account at [railway.app](https://railway.app)
2. Install the Railway CLI (optional):
   ```
   npm install -g @railway/cli
   ```

### Method 1: Deploy using GitHub Integration (Recommended)

1. Push your code to GitHub (which we've already done)
2. Login to Railway Dashboard [https://railway.app/dashboard](https://railway.app/dashboard)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your URL shortener repository
5. Railway will automatically detect your project structure
6. Configure environment variables:
   - MONGODB_URI="your-mongodb-atlas-connection-string"
   - NODE_ENV="production" 
   - PORT=5000 (or your preferred port)
   - BASE_URL="https://your-project-name.up.railway.app"

7. For the frontend, set:
   - REACT_APP_API_URL="https://your-project-name.up.railway.app/api"

8. Railway will automatically build and deploy your application

### Method 2: Deploy using Railway CLI

1. Login to Railway through the CLI:
   ```
   railway login
   ```
2. Navigate to your project directory and initialize Railway:
   ```
   cd url-shortener
   railway init
   ```
3. Link to an existing project or create a new one:
   ```
   railway link
   ```
   OR
   ```
   railway project create
   ```
4. Set up environment variables:
   ```
   railway variables set MONGODB_URI="your-mongodb-atlas-connection-string"
   railway variables set NODE_ENV="production"
   railway variables set PORT=5000
   railway variables set BASE_URL="https://your-project-name.up.railway.app"
   railway variables set REACT_APP_API_URL="https://your-project-name.up.railway.app/api"
   ```
5. Deploy your application:
   ```
   railway up
   ```

### Method 3: Deploy Backend and Frontend Separately on Railway

1. Create two separate projects in Railway: one for backend and one for frontend
2. For the backend:
   - Create a new project and connect to your GitHub repository
   - Set the root directory to `/backend`
   - Configure environment variables as mentioned above
   
3. For the frontend:
   - Create a new project and connect to your GitHub repository
   - Set the root directory to `/frontend`
   - Set REACT_APP_API_URL to your backend service URL
   
4. Railway will automatically build and deploy both services
5. Follow the prompts to complete the deployment

### Frontend Deployment to Netlify

1. Update the API base URL in the frontend .env file:
   ```
   REACT_APP_API_URL=https://your-url-shortener-api.herokuapp.com/api
   ```
2. Build the frontend:
   ```
   cd frontend
   npm run build
   ```
3. Install Netlify CLI:
   ```
   npm install -g netlify-cli
   ```
4. Deploy to Netlify:
   ```
   netlify login
   netlify deploy
   ```
5. When prompted, specify the build directory as `build`
6. To deploy the production version:
   ```
   netlify deploy --prod
   ```

## Post-Deployment Verification

After deploying your application, verify:

1. The application loads correctly
2. You can create new short URLs
3. Short URL redirects work properly
4. The admin dashboard displays all URLs

## Troubleshooting

- **Application crashes on startup**: Check the logs with `heroku logs --tail` to identify the issue
- **Database connection issues**: Verify your MongoDB connection string and network access settings
- **CORS errors**: Make sure your backend allows requests from your frontend domain
- **Environment variables missing**: Double-check that all required environment variables are set in your cloud platform
