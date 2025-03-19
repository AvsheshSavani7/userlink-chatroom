#!/bin/bash

echo "=== Preparing for Netlify Deployment ==="

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Build the project
echo "Building the project..."
npm run build

# Create a Netlify.toml file if it doesn't exist
if [ ! -f "netlify.toml" ]; then
    echo "Creating netlify.toml file..."
    cat > netlify.toml << EOF
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF
fi

# Login to Netlify if not already logged in
echo "Checking Netlify login status..."
netlify status

if [ $? -ne 0 ]; then
    echo "Please log in to Netlify:"
    netlify login
fi

# Initialize a new Netlify site or use existing one
echo "Initializing Netlify site..."
netlify sites:list

read -p "Do you want to create a new site or use an existing one? (new/existing): " site_choice

if [ "$site_choice" = "new" ]; then
    echo "Creating a new Netlify site..."
    netlify sites:create
else
    echo "Please select a site to deploy to:"
    netlify sites:list
    read -p "Enter the site name: " site_name
    netlify link --name "$site_name"
fi

# Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod

echo "=== Deployment Complete ==="
echo "Your site is now deployed on Netlify!"
echo "Note: Remember to set up your environment variables in the Netlify dashboard." 