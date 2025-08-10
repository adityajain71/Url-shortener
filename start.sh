#!/bin/bash

echo "Starting URL Shortener Application..."
echo ""
echo "This script will start both frontend and backend servers."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Node.js is not installed. Please install Node.js and try again."
  exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "npm is not installed. Please install npm and try again."
  exit 1
fi

echo "Installing dependencies..."
npm run install-all

echo ""
echo "Starting development servers..."
npm run dev
