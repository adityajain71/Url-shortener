# URL Shortener - MERN Stack Application

A full-stack URL shortener application built with the MERN stack (MongoDB, Express, React, Node.js). This application allows users to shorten long URLs into more manageable links and tracks the usage of these shortened URLs.

## Security Note

This application has been audited for security vulnerabilities:
- All backend dependencies are free of vulnerabilities
- Frontend development dependencies (React Scripts, etc.) contain some vulnerabilities that do not affect the production build
- The production build process removes these vulnerable dependencies 
- All user inputs are properly validated both on frontend and backend

## Features

- Shorten long URLs into easy-to-share links
- Copy shortened URLs to clipboard with one click
- Track click counts for each shortened URL
- Admin dashboard to view all URLs and their statistics
- Responsive design for mobile and desktop use

## Project Structure

```
url-shortener/
├── backend/               # Backend server (Node.js & Express)
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── .env               # Environment variables
│   ├── package.json       # Backend dependencies
│   └── server.js          # Server entry point
│
└── frontend/              # Frontend application (React)
    ├── public/            # Public assets
    ├── src/               # Source files
    │   ├── components/    # React components
    │   ├── pages/         # Page components
    │   └── App.js         # Main React component
    └── package.json       # Frontend dependencies
```

## Prerequisites

- Node.js (v14 or later)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Installation

### Quick Start

Use the provided start scripts to quickly set up and run the application:

#### Windows
```bash
start.bat
```

#### macOS/Linux
```bash
chmod +x start.sh
./start.sh
```

### Manual Setup

#### Clone the repository

```bash
git clone <repository-url>
cd url-shortener
```

#### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/url-shortener
BASE_URL=http://localhost:5000
```

Note: Adjust the `MONGODB_URI` and `BASE_URL` as needed for your environment.

4. Start the backend server:

```bash
npm run dev
```

The backend server will run on http://localhost:5000

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:

```bash
cd ../frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the frontend development server:

```bash
npm start
```

The frontend development server will run on http://localhost:3000

## API Endpoints

- `POST /api/shorten`: Create a new shortened URL
  - Request body: `{ "originalUrl": "https://example.com/long-url" }`
  - Response: `{ "shortUrl": "http://domain/abc123", "originalUrl": "https://example.com/long-url", ... }`

- `GET /:shortCode`: Redirect to the original URL

- `GET /api/urls`: Get all URLs (for admin dashboard)
  - Response: `[{ "shortUrl": "http://domain/abc123", "originalUrl": "https://example.com/long-url", "clicks": 5, ... }]`

## Deployment

### Backend Deployment (Heroku)

1. Create a new Heroku app
2. Connect your GitHub repository or use Heroku CLI to deploy
3. Set the following environment variables in Heroku:
   - `MONGODB_URI`: Your MongoDB connection string (e.g., MongoDB Atlas URL)
   - `BASE_URL`: Your Heroku app URL (e.g., https://your-app-name.herokuapp.com)
   - `NODE_ENV`: Set to `production`

### Frontend Deployment (Vercel/Netlify)

1. Build the React application:

```bash
cd frontend
npm run build
```

2. Deploy the build directory to Vercel, Netlify, or your preferred static hosting service.
3. Update the API base URL in the frontend to point to your deployed backend.

### Combined Deployment

For a simplified deployment, you can deploy both frontend and backend to Heroku:

1. Ensure your Express server serves the React build files in production mode (already configured in this project)
2. Update the `package.json` in the root directory to include scripts for installing both frontend and backend dependencies.

## License

MIT
