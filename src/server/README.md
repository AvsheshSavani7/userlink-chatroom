# UserLink Chatroom API Server

This is a standalone JSON Server that provides persistent API endpoints for the UserLink Chatroom application.

## Endpoints

- `/users` - User data
- `/assistants` - AI assistants data 
- `/files` - File metadata
- `/messages` - Chat messages

## Local Development

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm run dev
```

The server will run on port 3002 by default.

## Deployment on Render

### Prerequisites

- A [Render](https://render.com) account

### Steps

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: userlink-chatroom-api (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `server` (if the server folder is at the root of your repo)

4. Add environment variables if needed

### Important Notes

- The server uses a JSON file for data storage, which means:
  - Data is persisted between server restarts
  - However, deploying new code will reset the database unless you're using a mounted disk
  - For production, consider upgrading to a more robust database solution

## Moving to a Real Database

For production use, you might want to replace the JSON Server with:

1. MongoDB + Mongoose
2. PostgreSQL + Sequelize/Prisma
3. Supabase (PostgreSQL)
4. Firebase

This would require modifying the server.js file to connect to your chosen database. 