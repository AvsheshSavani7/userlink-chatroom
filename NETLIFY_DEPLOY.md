# Deploying to Netlify

This guide explains how to deploy this application to Netlify, including the JSON Server API.

## Prerequisites

- A Netlify account
- Git repository for your project

## Local Development

To test the Netlify setup locally:

```bash
# Install the Netlify CLI if you haven't already
npm install -g netlify-cli

# Run the development server with Netlify functions
npm run netlify:dev
```

This will start both the frontend and the API using Netlify Functions.

## Deployment Steps

### 1. Push Your Code to a Git Repository

Make sure all your changes are committed and pushed to a Git repository (GitHub, GitLab, etc.).

### 2. Connect to Netlify

- Log in to your Netlify account
- Click "New site from Git"
- Connect to your Git provider and select your repository
- Configure the build settings:
  - Build command: `npm run build`
  - Publish directory: `dist`

### 3. Configure Environment Variables

In the Netlify UI, go to Site settings > Environment variables and add:

- `VITE_OPENAI_API_KEY`: Your OpenAI API key 
- Any other environment variables needed by your application

### 4. Deploy

Click "Deploy site" and wait for the build to complete.

### 5. Test Your Deployed API

Once deployed, your API should be available at:

```
https://your-netlify-site.netlify.app/api
```

And your frontend will automatically connect to it.

## Troubleshooting

- **API Not Working**: Check the Functions log in the Netlify dashboard
- **Build Failing**: Review the build logs for errors
- **Database Not Found**: Ensure db.json is being properly copied during build

## Important Notes

- The db.json file is copied to the Netlify Functions directory during build
- Changes to the database on Netlify will not be persistent between deploys
- For a production app, consider using a real database instead of JSON Server 