# Deploying the URL Shortener to Render

This guide walks you through deploying your URL Shortener application to Render.

## Prerequisites

1. A [Render account](https://render.com/) - You can sign up for free
2. Your URL Shortener code pushed to GitHub
3. MongoDB Atlas account (for the database)

## Step 1: Set up MongoDB on Atlas

1. Create a MongoDB Atlas account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) if you don't have one
2. Create a new cluster (the free tier is sufficient)
3. Once your cluster is created:
   - Click on "Connect"
   - Choose "Connect your application"
   - Copy the connection string (it looks like: `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`)
   - Replace `<password>` with your actual password and `myFirstDatabase` with `url-shortener`

## Step 2: Deploy to Render

### Deploy the Web Service

1. Log in to your Render dashboard: [dashboard.render.com](https://dashboard.render.com/)
2. Click the "New +" button and select "Web Service"
3. Connect your GitHub account if you haven't already
4. Select the URL Shortener repository
5. Configure your web service:
   - **Name**: `url-shortener` (or any name you prefer)
   - **Environment**: `Node`
   - **Region**: Choose the closest region to your users
   - **Branch**: `master` (or your main branch)
   - **Build Command**: `npm install && cd frontend && npm install && npm run build && cd ..`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

6. Under "Advanced" settings, add the following environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string from Step 1
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render uses this port by default)

7. Click "Create Web Service"

## Step 3: Verify Deployment

1. Render will start the deployment process which may take a few minutes
2. Once deployment is complete, you'll see a URL for your application (like `https://url-shortener.onrender.com`)
3. Click on the URL to verify that your application is working

## Step 4: Update Frontend API URL (if needed)

If your frontend is not correctly connecting to your backend API, you may need to update the API URL:

1. Go back to your Render dashboard
2. Click on your URL shortener web service
3. Go to "Environment" tab
4. Add a new environment variable:
   - `REACT_APP_API_URL`: `/api` (since both frontend and backend are deployed together)
5. Click "Save Changes" and wait for the service to redeploy

## Troubleshooting

### MongoDB Connection Issues

If you're experiencing MongoDB connection problems:

1. Double-check your MongoDB Atlas connection string in the environment variables
2. Make sure your IP address is allowed in MongoDB Atlas Network Access settings (or set it to allow connections from anywhere: 0.0.0.0/0)
3. Check the logs in the Render dashboard for specific error messages

### Frontend Not Loading

If your frontend isn't loading but the backend works:

1. Verify the build command completed successfully in the logs
2. Make sure the frontend build path in your server.js matches where Render places the build files

### Health Check Failures

If the service keeps restarting due to health check failures:

1. Go to the "Events" tab in your Render dashboard to see what's happening
2. You might need to modify the health check endpoint in your application

## Scaling

When your application gets more traffic, you can upgrade from the free tier:

1. Go to your web service in the Render dashboard
2. Click on "Change Plan" under the Info section
3. Select a paid plan that meets your needs

## Ongoing Maintenance

- Render automatically deploys when you push to your GitHub repository
- You can manually trigger deploys from the Render dashboard
- View logs in the Render dashboard to troubleshoot issues

## Additional Resources

- [Render Node.js Documentation](https://render.com/docs/deploy-node-express-app)
- [Environment Variables on Render](https://render.com/docs/environment-variables)
