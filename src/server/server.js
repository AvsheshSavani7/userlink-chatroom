const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Create server
const server = express();

// Set port
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
server.get("/health", (req, res) => {
  res.json({
    message: "UserLink Chatroom API is running",
    endpoints: ["/users", "/assistants", "/files", "/messages"]
  });
});

// Start JSON Server as a child process
const startJsonServer = () => {
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
      console.log(`JSON Server: ${data}`);
    });

    jsonServer.stderr.on("data", (data) => {
      console.error(`JSON Server Error: ${data}`);
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
      console.log(`JSON Server: ${data}`);
    });

    jsonServer.stderr.on("data", (data) => {
      console.error(`JSON Server Error: ${data}`);
    });

    return jsonServer;
  }
};

// Start the JSON Server
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
