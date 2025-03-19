# Deploying the Chat App to Netlify

This guide provides step-by-step instructions for deploying this chat application to Netlify, including the JSON Server backend.

## Prerequisites

- A Netlify account (free tier is sufficient)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Local Testing Before Deployment

You can test the complete Netlify setup locally before deploying:

```bash
# Build the application
npm run build

# Run a simple test of the API function
node netlify/test-function.js
```

## Deployment Steps

### 1. Push to Git

Ensure all your code is committed and pushed to your Git repository:

```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push
```

### 2. Deploy to Netlify

#### Option 1: Deploy from the Netlify Dashboard

1. Log in to your Netlify account
2. Click "Add new site" > "Import an existing project"
3. Connect to your Git provider and select your repository
4. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy site"

#### Option 2: Deploy using the Netlify CLI

```bash
# Install Netlify CLI globally if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize the Netlify site
netlify init

# Follow the prompts to configure your site
# Choose "Create & configure a new site"

# Deploy your site
netlify deploy --prod
```

### 3. Configure Environment Variables

In the Netlify Dashboard:

1. Go to Site settings > Build & deploy > Environment
2. Add the following environment variables:
   - `VITE_OPENAI_API_KEY`: Your OpenAI API key
   - Any other environment variables your app needs

### 4. Verify Deployment

1. Once deployment is complete, visit your Netlify URL
2. Test the API by navigating to `/api` on your deployed site
3. Test the chat functionality to ensure it's working with the API

## Important Notes

- **Database Persistence**: The JSON Server database on Netlify isn't persistent between deployments or server restarts. For a production app, consider using a real database service.

- **API Key Security**: The OpenAI API key is included in your frontend code, which is not recommended for production. For better security, use Netlify Functions to make API calls server-side.

- **Custom Domain**: You can set up a custom domain for your app in the Netlify Dashboard under Domain settings.

## Troubleshooting

- **Build Failures**: Check the build logs in the Netlify Dashboard.
- **API Not Working**: 
  - Check the Functions logs in the Netlify Dashboard
  - Ensure the `.env.production` file has the correct API path
  - Verify that `db.json` is being properly copied during build
- **CORS Issues**: If you encounter CORS errors, check the JSON Server configuration in the function file. 