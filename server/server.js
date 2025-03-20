const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Create server
const server = express();

// Set ports
const PORT = process.env.PORT || 3002;

// Enable CORS for all origins
server.use(cors());

// Parse JSON bodies
server.use(express.json());

// Initialize database if it doesn't exist
const dbPath = path.join(__dirname, "db.json");
if (!fs.existsSync(dbPath)) {
  console.log("Creating initial database...");
  const initialData = {
    users: [],
    assistants: [],
    files: [],
    chat_threads: [],
    messages: []
  };
  fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
}

// Root route for basic information
server.get("/", (req, res) => {
  res.json({
    message: "UserLink Chatroom API is running",
    endpoints: ["/users", "/assistants", "/files", "/messages"]
  });
});

// Health check endpoint for Render
server.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    message: "API is running"
  });
});

// Detect if we're running on Render
const isRender = process.env.RENDER === "true" || process.env.RENDER === "1";

// Function to start JSON Server as a child process
const startJsonServer = () => {
  // On Render, we'll skip the child process and directly use json-server
  if (isRender) {
    console.log("Running on Render, using json-server package directly");
    // We won't spawn a child process - instead we'll initialize json-server later
    return null;
  }

  const jsonServerPath = path.resolve(
    process.cwd(),
    "node_modules/.bin/json-server"
  );

  if (!fs.existsSync(jsonServerPath)) {
    console.error(`JSON Server executable not found at ${jsonServerPath}`);
    console.log("Using global json-server instead");

    const jsonServer = spawn("json-server", [
      "--watch",
      dbPath,
      "--port",
      PORT
    ]);

    jsonServer.stdout.on("data", (data) => {
      console.log(`JSON Server: ${data.toString()}`);
    });

    jsonServer.stderr.on("data", (data) => {
      console.error(`JSON Server Error: ${data.toString()}`);
    });

    return jsonServer;
  } else {
    console.log("Using local json-server");

    const jsonServer = spawn(jsonServerPath, [
      "--watch",
      dbPath,
      "--port",
      PORT
    ]);

    jsonServer.stdout.on("data", (data) => {
      console.log(`JSON Server: ${data.toString()}`);
    });

    jsonServer.stderr.on("data", (data) => {
      console.error(`JSON Server Error: ${data.toString()}`);
    });

    return jsonServer;
  }
};

// For Render deployment, we'll directly use json-server
if (isRender) {
  try {
    const jsonServer = require("json-server");
    const router = jsonServer.router(dbPath);
    const middlewares = jsonServer.defaults();

    // Use default middlewares (logger, static, cors)
    server.use(middlewares);

    // Add custom middleware for logging
    server.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });

    // Add created date for new users
    server.use((req, res, next) => {
      if (req.method === "POST" && req.path === "/users") {
        req.body.createdAt = new Date().toISOString();
      }
      next();
    });

    // Save the database state to file after write operations
    router.render = (req, res) => {
      // Only save for write operations
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        console.log(`Saved database after ${req.method} operation`);
      }
      res.json(res.locals.data);
    };

    // Use router
    server.use(router);

    // Start the server
    server.listen(PORT, () => {
      console.log(`JSON Server is running on port ${PORT}`);
      console.log(`API Base URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error setting up json-server:", error);
    // If json-server fails, at least start the express server
    server.listen(PORT, () => {
      console.log(
        `Express server is running on port ${PORT} (json-server failed to load)`
      );
    });
  }
} else {
  // For local development, start JSON Server as child process
  const jsonServerProcess = startJsonServer();

  // Handle process termination
  process.on("SIGINT", () => {
    console.log("Shutting down server...");
    if (jsonServerProcess) {
      jsonServerProcess.kill();
    }
    process.exit(0);
  });

  console.log(`Server starting on port ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}`);
}
